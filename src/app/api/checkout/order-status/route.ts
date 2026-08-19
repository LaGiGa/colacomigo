export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getMercadoPagoPayment } from '@/lib/api-lazy-loaders'
import { fulfillPaidOrder } from '@/lib/orders/fulfill'

/**
 * GET /api/checkout/order-status?orderId=xxx
 *
 * Roda com service_role — bypassa RLS. Consulta o banco E o Mercado Pago para
 * confirmar o pagamento mesmo que o webhook tenha falhado ou atrasado.
 *
 * Quando detecta aprovação, delega para `fulfillPaidOrder` — o mesmo caminho do
 * webhook. Como cada efeito é idempotente, rodar em paralelo com o webhook não
 * duplica e-mail, WhatsApp nem baixa de estoque.
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
            .select('id, status, mp_payment_id')
            .eq('id', orderId)
            .single()

        if (error || !order) {
            console.error('[ORDER-STATUS] Pedido não encontrado:', orderId, error)
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        if (order.status === 'paid') {
            return NextResponse.json({ status: 'paid', orderId })
        }

        if (!order.mp_payment_id) {
            return NextResponse.json({ status: order.status, orderId })
        }

        try {
            const payment = await getMercadoPagoPayment(order.mp_payment_id)
            console.log('[ORDER-STATUS] MP status:', payment.status, 'pedido:', orderId)

            if (payment.status === 'approved') {
                await fulfillPaidOrder({
                    orderId,
                    paymentId: payment.id,
                    paymentMethod: payment.payment_method_id,
                    source: 'polling',
                })
                return NextResponse.json({ status: 'paid', orderId, source: 'mp_polling' })
            }

            return NextResponse.json({ status: order.status, mp_status: payment.status, orderId })
        } catch (mpErr) {
            console.error('[ORDER-STATUS] Erro ao consultar MP:', mpErr)
            // Fallback: devolve o status do banco
            return NextResponse.json({ status: order.status, orderId })
        }
    } catch (err: any) {
        console.error('[API ORDER-STATUS ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
