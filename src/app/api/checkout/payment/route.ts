export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mpCreatePayment } from '@/lib/mercadopago'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { orderId, ...paymentData } = body

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID é obrigatório' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
        
        if (orderError || !order) {
            console.error('Order not found:', orderId)
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        // Ensure notification_url is a valid absolute URL
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://colacomigoshop.com.br').replace(/\/$/, '')
        
        const paymentPayload: any = {
            ...paymentData,
            transaction_amount: order.total,
            description: `Pedido #${orderId.slice(0, 8)}`,
            metadata: {
                order_id: orderId
            },
        }

        // Mercado Pago ONLY accepts notification_url if it's a valid public URL (not localhost)
        if (baseUrl.startsWith('http') && !baseUrl.includes('localhost')) {
            paymentPayload.notification_url = `${baseUrl}/api/checkout/webhook`
        }

        const payment = await mpCreatePayment(paymentPayload)

        // Update order status if approved
        if (payment.status === 'approved') {
            await supabase.from('orders').update({ 
                status: 'paid',
                mp_payment_id: String(payment.id)
            }).eq('id', orderId)
        } else {
            // Se está pendente (ex: PIX gerado), marca como 'awaiting_payment'
            await supabase.from('orders').update({ 
                status: payment.status === 'pending' || payment.status === 'in_process' ? 'awaiting_payment' : order.status,
                mp_payment_id: String(payment.id)
            }).eq('id', orderId)
        }

        // Record transaction
        await supabase.from('payment_transactions').insert({
            order_id: orderId,
            mp_payment_id: String(payment.id),
            amount: payment.transaction_amount || order.total,
            status: payment.status,
            method: payment.payment_method_id,
            raw_data: payment
        })

        // Prepare response for Brick
        // For PIX, we need point_of_interaction.transaction_data
        const responseData: any = {
            status: payment.status,
            status_detail: payment.status_detail,
            id: payment.id,
            paymentId: String(payment.id)
        }

        if (payment.point_of_interaction?.transaction_data) {
            responseData.pixQrCode = payment.point_of_interaction.transaction_data.qr_code
            responseData.pixQrCodeBase64 = payment.point_of_interaction.transaction_data.qr_code_base64
        }

        return NextResponse.json(responseData)
    } catch (err: any) {
        console.error('[API CHECKOUT PAYMENT ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
