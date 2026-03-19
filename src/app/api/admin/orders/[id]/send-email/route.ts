export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, getPurchaseEmailHtml, getShippingEmailHtml, formatCurrencyString } from '@/lib/email'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: orderId } = await params
    try {
        const supabase = createServiceClient()
        const { trackingCode } = await req.json()
        const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
        if (orderError || !order) throw orderError || new Error('Pedido não encontrado')

        const to = order.customer_email;
        if (!to) return NextResponse.json({ error: 'Pedido sem e-mail cadastrado' }, { status: 400 })

        if (trackingCode) {
            await sendEmail({
                to,
                subject: `Oba! Seu pedido #${orderId.slice(0, 8).toUpperCase()} foi enviado! 🚀`,
                html: getShippingEmailHtml(orderId, order.customer_name || 'Família', trackingCode)
            })
        } else {
            const { data: items } = await supabase
                .from('order_items')
                .select('quantity, total_price, variant:product_variants(size, color_name, product:products(name))')
                .eq('order_id', orderId);

            let itemsHtml = '';
            if (items) {
                itemsHtml = items.map((it: any) => `
                    <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                        <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                        <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                        <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrencyString(it.total_price)}</p>
                    </div>
                `).join('');
            }

            await sendEmail({
                to,
                subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                html: getPurchaseEmailHtml(orderId, order.customer_name || 'Família', itemsHtml, order.total || 0)
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[API ADMIN ORDER SEND EMAIL ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
