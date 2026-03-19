export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMercadoPagoPayment, sendEmailWithLazyLoad, getPurchaseEmailHtmlLazy, formatCurrencyStringLazy, getCompanyNewSaleEmailHtmlLazy } from '@/lib/api-lazy-loaders'

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const body = await req.json().catch(() => ({}))
        
        const type = url.searchParams.get('type') || body.type
        const dataId = url.searchParams.get('data.id') || body.data?.id
        
        console.log('[MP WEBHOOK RAW]', { 
            type, 
            dataId, 
            queryParams: Object.fromEntries(url.searchParams.entries()),
            bodyKeys: Object.keys(body) 
        })

        if (type === 'payment' && dataId) {
            const payment = await getMercadoPagoPayment(dataId)
            console.log('[MP WEBHOOK PAYMENT FETCHED]', {
                id: payment.id,
                status: payment.status,
                metadata: payment.metadata,
                external_ref: payment.external_reference
            })

            if (payment.status === 'approved') {
                const orderId = payment.metadata?.order_id || payment.external_reference
                
                if (!orderId) {
                    console.error('[MP WEBHOOK] Sem orderId no metadata ou external_reference')
                    return NextResponse.json({ received: true })
                }
                
                console.log('[MP WEBHOOK] Processando pedido:', orderId)
                const supabase = createServiceClient()
                
                // Buscamos o pedido com todas as colunas necessárias para o e-mail
                const { data: order, error: orderFetchErr } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single()

                if (orderFetchErr || !order) {
                    console.error('[MP WEBHOOK] Pedido não encontrado ou erro:', orderFetchErr)
                    return NextResponse.json({ received: true })
                }

                // Só processamos se estiver em estado pendente
                if (order.status === 'pending' || order.status === 'awaiting_payment') {
                    console.log('[MP WEBHOOK] Atualizando status do pedido para paid...')
                    
                    const { error: updateOrderErr } = await supabase
                        .from('orders')
                        .update({ 
                            status: 'paid', 
                            mp_payment_id: String(payment.id),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId)

                    if (updateOrderErr) console.error('[MP WEBHOOK] Erro ao atualizar pedido:', updateOrderErr)

                    const { error: updateTransErr } = await supabase
                        .from('payment_transactions')
                        .update({ status: 'approved' })
                        .eq('mp_payment_id', String(payment.id))
                    
                    if (updateTransErr) console.error('[MP WEBHOOK] Erro ao atualizar transação:', updateTransErr)

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
                        } catch (e) { console.error('[EMAIL ERROR]', e) }
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
                        } catch (e) { console.error('[ADMIN EMAIL ERROR]', e) }
                    }
                } else {
                    console.log('[MP WEBHOOK] Pedido já processado ou em outro status:', order.status)
                }
            } else {
                console.log('[MP WEBHOOK] Pagamento não aprovado:', payment.status)
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('[API CHECKOUT WEBHOOK ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
