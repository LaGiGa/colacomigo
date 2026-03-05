import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import mercadopago from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'

/** Valida a assinatura HMAC SHA256 do Mercado Pago */
function validateMpSignature(request: NextRequest): boolean {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const secret = process.env.MP_WEBHOOK_SECRET

    if (!xSignature || !xRequestId || !secret) return false

    const params: Record<string, string> = {}
    xSignature.split(',').forEach((part) => {
        const [key, value] = part.trim().split('=')
        if (key && value) params[key] = value
    })

    const ts = params['ts']
    const v1 = params['v1']
    if (!ts || !v1) return false

    const url = new URL(request.url)
    const dataId = url.searchParams.get('data.id') ?? ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
}

function mapMpStatus(mpStatus: string): string {
    const map: Record<string, string> = {
        approved: 'paid',
        pending: 'awaiting_payment',
        in_process: 'awaiting_payment',
        rejected: 'cancelled',
        cancelled: 'cancelled',
        refunded: 'refunded',
        charged_back: 'refunded',
    }
    return map[mpStatus] ?? 'awaiting_payment'
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text()

    // ─── 1. Valida assinatura ────────────────────────────────────────
    if (!validateMpSignature(request)) {
        console.error('[MP Webhook] Assinatura inválida')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { type?: string; data?: { id?: string } }
    try {
        body = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (body.type !== 'payment' || !body.data?.id) {
        return NextResponse.json({ received: true })
    }

    const mpPaymentId = body.data.id

    try {
        // ─── 2. Consulta detalhes do pagamento ───────────────────────
        const payment = await new Payment(mercadopago).get({ id: mpPaymentId })
        const orderId = (payment.metadata as Record<string, string> | undefined)?.order_id
        if (!orderId) {
            return NextResponse.json({ received: true })
        }

        const newStatus = mapMpStatus(payment.status ?? 'pending')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createServiceClient()

        // ─── 3. Registra a transação ────────────────────────────────
        await supabase.from('payment_transactions').insert({
            order_id: orderId,
            mp_payment_id: String(mpPaymentId),
            amount: payment.transaction_amount ?? null,
            method: payment.payment_type_id ?? null,
            status: payment.status ?? null,
            raw_data: payment as unknown as Record<string, unknown>,
        })

        // ─── 4. Atualiza status do pedido ───────────────────────────
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus, mp_payment_id: String(mpPaymentId) })
            .eq('id', orderId)

        if (error) {
            return NextResponse.json({ error: 'DB error' }, { status: 500 })
        }

        // ─── 5. Se pago, decrementa estoque e envia e-mail ───────────
        if (newStatus === 'paid') {
            const { data: orderData } = await supabase
                .from('orders')
                .select('user_id, total')
                .eq('id', orderId)
                .single()

            const { data: items } = await supabase
                .from('order_items')
                .select(`
                    id, variant_id, quantity, unit_price, total_price,
                    variant:product_variants(
                        sku, size, color_name,
                        product:products(name)
                    )
                `)
                .eq('order_id', orderId)

            if (items && Array.isArray(items) && orderData) {
                for (const item of items) {
                    await supabase.rpc('decrement_stock', {
                        p_variant_id: item.variant_id,
                        p_qty: item.quantity,
                    })
                }

                // Enviar e-mail de confirmação
                const { data: authUser } = await supabase.auth.admin.getUserById(orderData.user_id)
                if (authUser.user?.email) {
                    const itemsHtml = items.map((it: any) => `
                        <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                            <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                            <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                            <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrency(it.total_price)}</p>
                        </div>
                    `).join('')

                    const emailHtml = `
                    <div style="background-color: #000; color: #fff; font-family: sans-serif; padding: 0; border: 1px solid #333; max-width: 600px; margin: 0 auto;">
                        <!-- Banner Agradecimento -->
                        <div style="width: 100%; overflow: hidden;">
                            <img src="${process.env.NEXT_PUBLIC_APP_URL}/emails/agradecimento.png" alt="Agradecemos pela sua compra!" style="width: 100%; display: block;">
                        </div>

                        <div style="padding: 40px;">
                            <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; margin: 0;">Cola Comigo Shop</h1>
                            <hr style="border: 0; border-top: 2px solid #1a8fff; margin: 20px 0;">
                            <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase;">Pagamento Confirmado! ✅</h2>
                            <p style="color: #888;">Fala família! O seu pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> já foi confirmado e está sendo preparado para o drop.</p>
                            
                            <div style="margin: 30px 0;">
                                <h3 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Resumo do Drop</h3>
                                ${itemsHtml}
                            </div>

                            <div style="background-color: #111; padding: 20px; text-align: right; border-left: 4px solid #1a8fff;">
                                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Total Pago:</p>
                                <p style="margin: 0; font-size: 24px; font-weight: 900; color: #1a8fff;">${formatCurrency(orderData.total)}</p>
                            </div>
                            
                            <p style="font-size: 14px; color: #fff; margin-top: 30px; font-weight: 700;">Dicas de quem manja:</p>
                            <div style="width: 100%; margin-top: 10px; border: 1px solid #222;">
                                <img src="${process.env.NEXT_PUBLIC_APP_URL}/emails/cuidados.png" alt="Cuidados com sua peça" style="width: 100%; display: block;">
                            </div>

                            <footer style="margin-top: 40px; border-top: 1px solid #222; pt: 20px; text-align: center;">
                                <p style="font-size: 12px; color: #666;">Qualquer dúvida, brota no WhatsApp: (63) 99131-2913</p>
                                <p style="font-size: 10px; color: #444; margin-top: 10px;">© ${new Date().getFullYear()} Cola Comigo Shop. Todos os direitos reservados.</p>
                            </footer>
                        </div>
                    </div>
                    `
                    await sendEmail({
                        to: authUser.user.email,
                        subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                        html: emailHtml
                    })
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[MP Webhook] Erro interno:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok' })
}
