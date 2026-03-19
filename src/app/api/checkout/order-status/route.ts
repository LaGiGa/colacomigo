export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoPayment, sendEmailWithLazyLoad, getPurchaseEmailHtmlLazy, formatCurrencyStringLazy, getCompanyNewSaleEmailHtmlLazy } from '@/lib/api-lazy-loaders'

/**
 * GET /api/checkout/order-status?orderId=xxx
 *
 * Roda no servidor com service_role — bypassa RLS completamente.
 * Consulta o banco E o Mercado Pago para garantir que o status esteja atualizado,
 * mesmo que o webhook tenha falhado.
 */
export async function GET(req: NextRequest) {
    try {
        const orderId = req.nextUrl.searchParams.get('orderId')
        if (!orderId) {
            return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

        if (error || !order) {
            console.error('[ORDER-STATUS] Pedido não encontrado:', orderId, error)
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        // Se o banco já marcou como pago, retornamos direto
        if (order.status === 'paid') {
            return NextResponse.json({ status: 'paid', orderId })
        }

        // Se temos mp_payment_id, consultamos o Mercado Pago diretamente
        // Isso garante confirmação mesmo se o webhook falhou
        if (order.mp_payment_id) {
            try {
                const payment = await getMercadoPagoPayment(order.mp_payment_id)
                console.log('[ORDER-STATUS] MP Payment status:', payment.status, 'for order:', orderId)

                if (payment.status === 'approved' && order.status !== 'paid') {
                    // Webhook falhou ou ainda não chegou — atualizamos manualmente
                    console.log('[ORDER-STATUS] Aprovação detectada via polling. Atualizando pedido e enviando e-mails...')
                    
                    const { error: updateErr } = await supabase
                        .from('orders')
                        .update({
                            status: 'paid',
                            mp_payment_id: String(payment.id),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId)

                    if (updateErr) {
                        console.error('[ORDER-STATUS] Erro ao atualizar pedido:', updateErr)
                    } else {
                        // Atualiza também a transação
                        await supabase
                            .from('payment_transactions')
                            .update({ status: 'approved' })
                            .eq('mp_payment_id', String(payment.id))

                        // Busca itens para o e-mail
                        const { data: items } = await supabase
                            .from('order_items')
                            .select('quantity, total_price, variant:product_variants(size, color_name, product:products(name))')
                            .eq('order_id', orderId)

                        let itemsHtml = ''
                        if (items) {
                            const itemsHtmlPromises = items.map(async (it: any) => {
                                const price = await formatCurrencyStringLazy(it.total_price)
                                return `
                                <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                                    <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                                    <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                                    <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${price}</p>
                                </div>
                            `
                            })
                            itemsHtml = (await Promise.all(itemsHtmlPromises)).join('')
                        }

                        // Enviar e-mails
                        const to = order.customer_email
                        if (to) {
                            try {
                                await sendEmailWithLazyLoad({
                                    to,
                                    subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                                    html: await getPurchaseEmailHtmlLazy(orderId, order.customer_name || 'Família', itemsHtml, order.total || 0)
                                })
                            } catch (e) { console.error('[ORDER-STATUS EMAIL ERROR]', e) }
                        }

                        const adminNotifyEmail = process.env.NEW_SALE_NOTIFY_EMAIL || process.env.COMPANY_SALES_EMAIL || 'colacomigoshop@gmail.com'
                        if (adminNotifyEmail) {
                            try {
                                await sendEmailWithLazyLoad({
                                    to: adminNotifyEmail,
                                    subject: `Nova Venda! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                                    html: await getCompanyNewSaleEmailHtmlLazy({
                                        orderId,
                                        customerName: order.customer_name || 'Cliente',
                                        customerEmail: order.customer_email,
                                        customerPhone: order.customer_phone,
                                        total: order.total || 0,
                                        items: items?.map((it: any) => ({
                                            name: it.variant?.product?.name || 'Produto',
                                            quantity: it.quantity,
                                            totalPrice: it.total_price,
                                            size: it.variant?.size,
                                            colorName: it.variant?.color_name
                                        })) || []
                                    })
                                })
                            } catch (e) { console.error('[ORDER-STATUS ADMIN EMAIL ERROR]', e) }
                        }
                    }

                    return NextResponse.json({ status: 'paid', orderId, source: 'mp_polling' })
                }

                // Retorna o status do MP (pending, cancelled, etc)
                return NextResponse.json({ 
                    status: order.status, 
                    mp_status: payment.status,
                    orderId 
                })
            } catch (mpErr) {
                console.error('[ORDER-STATUS] Erro ao consultar MP:', mpErr)
                // Fallback: retorna o status do banco mesmo assim
            }
        }

        return NextResponse.json({ status: order.status, orderId })
    } catch (err: any) {
        console.error('[API ORDER-STATUS ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
