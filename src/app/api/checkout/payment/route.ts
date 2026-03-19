export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mpCreatePayment } from '@/lib/mercadopago'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { orderId, cardFormData, paymentMethodId, issuerId, installments, token, payer } = body

        if (!orderId || !token) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
        if (orderError || !order) throw new Error('Pedido não encontrado')

        const payment = await mpCreatePayment({
            transaction_amount: order.total,
            token,
            description: `Pedido #${orderId.slice(0, 8)}`,
            installments: Number(installments),
            payment_method_id: paymentMethodId,
            issuer_id: issuerId,
            payer: {
                email: payer.email,
                identification: {
                    type: payer.identification.type,
                    number: payer.identification.number
                }
            },
            metadata: {
                order_id: orderId
            }
        })

        if (payment.status === 'approved') {
            await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
        }

        // Registrar transação
        await supabase.from('payment_transactions').insert({
            order_id: orderId,
            mp_payment_id: String(payment.id),
            amount: payment.transaction_amount,
            status: payment.status,
            method: payment.payment_method_id
        })

        return NextResponse.json({ 
            status: payment.status, 
            status_detail: payment.status_detail,
            id: payment.id 
        })
    } catch (err: any) {
        console.error('[API CHECKOUT PAYMENT ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
