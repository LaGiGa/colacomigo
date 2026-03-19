export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mpGetPayment } from '@/lib/mercadopago'
import { sendEmail, getPurchaseEmailHtml, formatCurrencyString, getCompanyNewSaleEmailHtml } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const type = url.searchParams.get('type') || (await req.json().catch(() => ({}))).type
        const dataId = url.searchParams.get('data.id') || (await req.json().catch(() => ({}))).data?.id

        if (type === 'payment' && dataId) {
            const payment = await mpGetPayment(dataId)
            console.log('[MP WEBHOOK PAYMENT]', payment.id, payment.status, payment.metadata?.order_id)

            if (payment.status === 'approved' && payment.metadata?.order_id) {
                const orderId = payment.metadata.order_id
                const supabase = createServiceClient()
                const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()

                if (order && (order.status === 'pending' || order.status === 'awaiting_payment')) {
                    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
                    await supabase.from('payment_transactions').update({ status: 'approved' }).eq('mp_payment_id', String(payment.id))

                    const { data: items } = await supabase
                        .from('order_items')
                        .select('quantity, total_price, variant:product_variants(size, color_name, product:products(name))')
                        .eq('order_id', orderId)

                    let itemsHtml = ''
                    if (items) {
                        itemsHtml = items.map((it: any) => `
                            <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                                <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                                <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                                <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrencyString(it.total_price)}</p>
                            </div>
                        `).join('')
                    }

                    // Enviar e-mails
                    const to = order.customer_email
                    if (to) {
                        try {
                            await sendEmail({
                                to,
                                subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                                html: getPurchaseEmailHtml(orderId, order.customer_name || 'Família', itemsHtml, order.total || 0)
                            })
                        } catch (e) { console.error('[EMAIL ERROR]', e) }
                    }

                    const adminNotifyEmail = process.env.NEW_SALE_NOTIFY_EMAIL || process.env.COMPANY_SALES_EMAIL
                    if (adminNotifyEmail) {
                        try {
                            await sendEmail({
                                to: adminNotifyEmail,
                                subject: `Nova Venda! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                                html: getCompanyNewSaleEmailHtml({
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
                        } catch (e) { console.error('[ADMIN EMAIL ERROR]', e) }
                    }
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('[API CHECKOUT WEBHOOK ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
