/**
 * Processamento de um pedido aprovado — ponto ÚNICO de verdade.
 *
 * Antes esta lógica estava duplicada em `api/checkout/webhook` e
 * `api/checkout/order-status`, e as duas podiam rodar ao mesmo tempo
 * (o front faz polling de 5 em 5s enquanto o Mercado Pago chama o webhook),
 * o que gerava e-mail duplicado — e geraria baixa de estoque dobrada.
 *
 * Agora tudo passa por aqui e cada efeito colateral é reivindicado antes de
 * acontecer (claim-then-act), então rodar duas vezes é inofensivo:
 *
 *   1. marca o pedido como pago            (update condicional pelo status)
 *   2. dá baixa no estoque                 (RPC apply_order_stock, idempotente)
 *   3. incrementa o uso do cupom           (só quando a baixa realmente ocorreu)
 *   4. envia os e-mails                    (claim em orders.emails_sent_at)
 *   5. avisa a loja no WhatsApp            (claim em orders.whatsapp_notified_at)
 *
 * Falha em notificação nunca derruba a venda: cada etapa é isolada em try/catch.
 */

import { createServiceClient } from '@/lib/supabase/server'
import {
    sendEmailWithLazyLoad,
    getPurchaseEmailHtmlLazy,
    getCompanyNewSaleEmailHtmlLazy,
    formatCurrencyStringLazy,
} from '@/lib/api-lazy-loaders'
import { buildSaleNotificationMessage, sendWhatsAppTextWithRetry, normalizePhone } from '@/lib/whatsapp'

const PAID_FROM_STATUSES = ['pending', 'awaiting_payment', 'processing']

export interface FulfillOptions {
    orderId: string
    paymentId?: string | number | null
    paymentMethod?: string | null
    source: 'webhook' | 'polling' | 'manual'
}

export interface FulfillResult {
    ok: boolean
    orderId: string
    reason: 'fulfilled' | 'order_not_found' | 'error'
    stock?: unknown
    emailsSent?: boolean
    whatsappSent?: boolean
    error?: string
}

interface OrderItemRow {
    quantity: number
    total_price: number
    unit_price: number
    variant: {
        size: string | null
        color_name: string | null
        product: { name: string | null } | null
    } | null
}

export async function fulfillPaidOrder(opts: FulfillOptions): Promise<FulfillResult> {
    const { orderId, paymentId, paymentMethod, source } = opts
    const supabase = createServiceClient()
    const log = (msg: string, extra?: unknown) =>
        console.log(`[FULFILL:${source}] ${orderId.slice(0, 8)} — ${msg}`, extra ?? '')

    try {
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('*, shipping_address:addresses!address_id(*)')
            .eq('id', orderId)
            .single()

        if (orderErr || !order) {
            console.error('[FULFILL] Pedido não encontrado:', orderId, orderErr)
            return { ok: false, orderId, reason: 'order_not_found' }
        }

        // ─── 1. Marca como pago (só se ainda não estava) ─────────────────────
        const paidPatch: Record<string, unknown> = {
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
        if (paymentId) paidPatch.mp_payment_id = String(paymentId)
        if (paymentMethod) paidPatch.payment_method = paymentMethod

        const { data: flipped, error: flipErr } = await supabase
            .from('orders')
            .update(paidPatch)
            .eq('id', orderId)
            .in('status', PAID_FROM_STATUSES)
            .select('id')

        if (flipErr) console.error('[FULFILL] Erro ao marcar pedido como pago:', flipErr)
        else log(flipped?.length ? 'status → paid' : 'status já estava pago, seguindo para efeitos pendentes')

        if (paymentId) {
            const { error: txErr } = await supabase
                .from('payment_transactions')
                .update({ status: 'approved' })
                .eq('mp_payment_id', String(paymentId))
            if (txErr) console.error('[FULFILL] Erro ao atualizar transação:', txErr)
        }

        // ─── 2. Baixa de estoque (idempotente no banco) ──────────────────────
        let stockResult: unknown = null
        try {
            const { data, error } = await supabase.rpc('apply_order_stock', { p_order_id: orderId })
            if (error) throw error
            stockResult = data
            log('estoque', data)

            // ─── 3. Cupom: conta o uso só na primeira baixa efetiva ──────────
            const applied = (data as { reason?: string } | null)?.reason === 'applied'
            if (applied && order.coupon_id) {
                const { error: couponErr } = await supabase.rpc('increment_coupon_uses', {
                    p_coupon_id: order.coupon_id,
                })
                if (couponErr) console.error('[FULFILL] Erro ao contabilizar cupom:', couponErr)
            }
        } catch (err) {
            // Estoque é importante, mas não pode impedir a confirmação da venda.
            console.error('[FULFILL] Erro na baixa de estoque:', err)
        }

        // ─── Dados compartilhados pelas notificações ─────────────────────────
        const { data: rawItems } = await supabase
            .from('order_items')
            .select('quantity, total_price, unit_price, variant:product_variants(size, color_name, product:products(name))')
            .eq('order_id', orderId)

        const items = (rawItems ?? []) as unknown as OrderItemRow[]
        const address = (order as { shipping_address?: Record<string, string | null> | null }).shipping_address ?? null
        const resolvedPaymentMethod = paymentMethod || order.payment_method || null

        // ─── 4. E-mails (cliente + loja) ─────────────────────────────────────
        let emailsSent = false
        if (await claim(supabase, orderId, 'emails_sent_at')) {
            emailsSent = await sendOrderEmails({ order, items, paymentMethod: resolvedPaymentMethod })
            if (!emailsSent) await release(supabase, orderId, 'emails_sent_at')
        } else {
            log('e-mails já haviam sido enviados')
        }

        // ─── 5. WhatsApp da loja ─────────────────────────────────────────────
        let whatsappSent = false
        if (await claim(supabase, orderId, 'whatsapp_notified_at')) {
            whatsappSent = await notifyStoreOnWhatsApp({ supabase, order, items, address, paymentMethod: resolvedPaymentMethod })
            if (!whatsappSent) await release(supabase, orderId, 'whatsapp_notified_at')
        } else {
            log('WhatsApp já havia sido notificado')
        }

        return { ok: true, orderId, reason: 'fulfilled', stock: stockResult, emailsSent, whatsappSent }
    } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        console.error('[FULFILL] Erro inesperado:', error)
        return { ok: false, orderId, reason: 'error', error }
    }
}

// ─── Claim/release: garante que só um processo executa o efeito ──────────────

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * Tenta "reservar" o efeito colateral gravando o timestamp apenas se a coluna
 * ainda estiver nula. Se o update não devolver linha, outro processo já pegou.
 */
async function claim(supabase: ServiceClient, orderId: string, column: 'emails_sent_at' | 'whatsapp_notified_at') {
    const { data, error } = await supabase
        .from('orders')
        .update({ [column]: new Date().toISOString() })
        .eq('id', orderId)
        .is(column, null)
        .select('id')

    if (error) {
        console.error(`[FULFILL] Erro ao reservar ${column}:`, error)
        return false
    }
    return (data?.length ?? 0) > 0
}

/** Libera a reserva quando o envio falhou, para permitir nova tentativa depois. */
async function release(supabase: ServiceClient, orderId: string, column: 'emails_sent_at' | 'whatsapp_notified_at') {
    await supabase.from('orders').update({ [column]: null }).eq('id', orderId)
}

// ─── E-mails ────────────────────────────────────────────────────────────────

async function sendOrderEmails({
    order,
    items,
    paymentMethod,
}: {
    order: Record<string, any>
    items: OrderItemRow[]
    paymentMethod: string | null
}): Promise<boolean> {
    const orderId = order.id as string
    let anySent = false

    const itemsHtml = (
        await Promise.all(
            items.map(async (it) => {
                const price = await formatCurrencyStringLazy(it.total_price)
                const variant = [
                    it.variant?.size ? `Tamanho: ${it.variant.size}` : '',
                    it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : '',
                ].join('')
                return `
                <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                    <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name ?? 'Produto'} x ${it.quantity}</p>
                    <p style="margin: 0; font-size: 12px; color: #888;">${variant}</p>
                    <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${price}</p>
                </div>`
            })
        )
    ).join('')

    // Cliente
    if (order.customer_email) {
        try {
            await sendEmailWithLazyLoad({
                to: order.customer_email,
                subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                html: await getPurchaseEmailHtmlLazy(
                    orderId,
                    order.customer_name || 'Família',
                    itemsHtml,
                    order.total || 0
                ),
            })
            anySent = true
        } catch (e) {
            console.error('[FULFILL EMAIL CLIENTE ERROR]', e)
        }
    }

    // Loja
    const adminEmail =
        process.env.NEW_SALE_NOTIFY_EMAIL || process.env.COMPANY_SALES_EMAIL || 'colacomigoshop@gmail.com'
    if (adminEmail) {
        try {
            await sendEmailWithLazyLoad({
                to: adminEmail,
                subject: `Nova Venda! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                html: await getCompanyNewSaleEmailHtmlLazy({
                    orderId,
                    customerName: order.customer_name || 'Cliente',
                    customerEmail: order.customer_email,
                    customerPhone: order.customer_phone,
                    paymentMethod,
                    shippingMethod: order.shipping_label || order.shipping_method,
                    total: order.total || 0,
                    items: items.map((it) => ({
                        name: it.variant?.product?.name || 'Produto',
                        quantity: it.quantity,
                        totalPrice: it.total_price,
                        size: it.variant?.size,
                        colorName: it.variant?.color_name,
                    })),
                }),
            })
            anySent = true
        } catch (e) {
            console.error('[FULFILL EMAIL LOJA ERROR]', e)
        }
    }

    return anySent
}

// ─── WhatsApp ───────────────────────────────────────────────────────────────

/** Número que recebe a notificação: painel → variável de ambiente → padrão da loja. */
export async function resolveStoreWhatsAppNumber(
    supabase: ServiceClient
): Promise<{ number: string | null; enabled: boolean }> {
    try {
        const { data } = await supabase
            .from('store_settings')
            .select('whatsapp_notify_enabled, whatsapp_notify_number')
            .eq('id', 1)
            .single()

        const settings = data as { whatsapp_notify_enabled?: boolean; whatsapp_notify_number?: string } | null
        const number = normalizePhone(
            settings?.whatsapp_notify_number || process.env.STORE_WHATSAPP_NUMBER || '5563991312913'
        )
        return { number, enabled: settings?.whatsapp_notify_enabled !== false }
    } catch (err) {
        console.error('[FULFILL] Erro ao ler config de WhatsApp:', err)
        const number = normalizePhone(process.env.STORE_WHATSAPP_NUMBER || '5563991312913')
        return { number, enabled: true }
    }
}

async function notifyStoreOnWhatsApp({
    supabase,
    order,
    items,
    address,
    paymentMethod,
}: {
    supabase: ServiceClient
    order: Record<string, any>
    items: OrderItemRow[]
    address: Record<string, string | null> | null
    paymentMethod: string | null
}): Promise<boolean> {
    const { number, enabled } = await resolveStoreWhatsAppNumber(supabase)

    if (!enabled) {
        console.log('[FULFILL] Notificação de WhatsApp desativada no painel.')
        return true // desativado de propósito — não é falha, não deve retentar
    }
    if (!number) {
        console.error('[FULFILL] Número de WhatsApp da loja não configurado.')
        return false
    }

    const message = buildSaleNotificationMessage({
        orderId: order.id,
        total: order.total || 0,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        discount: order.discount,
        couponCode: order.coupon_code,
        paymentMethod,
        shippingMethod: order.shipping_method,
        shippingLabel: order.shipping_label,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        address,
        items: items.map((it) => ({
            name: it.variant?.product?.name || 'Produto',
            quantity: it.quantity,
            totalPrice: it.total_price,
            size: it.variant?.size,
            colorName: it.variant?.color_name,
        })),
    })

    const result = await sendWhatsAppTextWithRetry(number, message)
    if (!result.success) {
        console.error('[FULFILL WHATSAPP ERROR]', result.provider, result.error)
        return false
    }

    console.log(`[FULFILL] WhatsApp enviado via ${result.provider} para ${number}`)
    return true
}
