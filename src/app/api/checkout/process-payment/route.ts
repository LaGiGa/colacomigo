import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import mercadopago from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { z } from 'zod'

const ProcessPaymentSchema = z.object({
    preferenceId: z.string(),
    selectedPaymentMethod: z.string(),
    formData: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest) {
    let body: z.infer<typeof ProcessPaymentSchema>

    try {
        body = ProcessPaymentSchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json({ error: 'Payload inválido', details: err }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceClient()

    // Busca o pedido vinculado ao preference_id
    const { data: order } = await supabase
        .from('orders')
        .select('id, total, profile_id')
        .eq('mp_preference_id', body.preferenceId)
        .single()

    if (!order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    try {
        // Cria o pagamento direto via API do MP (Checkout Transparente)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentData: any = {
            ...body.formData,
            transaction_amount: order.total,
            description: `Cola Comigo Shop — Pedido ${order.id.slice(0, 8)}`,
            metadata: {
                order_id: order.id,
            },
            // Notificação via webhook (já configurado)
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        }

        // PIX e boleto não precisam de parcelas
        if (body.selectedPaymentMethod === 'credit_card') {
            paymentData.installments = body.formData.installments ?? 1
        }

        const payment = await new Payment(mercadopago).create({
            body: paymentData,
        })

        const paymentStatus = payment.status ?? 'pending'
        const newOrderStatus =
            paymentStatus === 'approved' ? 'paid' :
                paymentStatus === 'rejected' ? 'cancelled' :
                    'awaiting_payment'

        // Atualiza o pedido com o resultado do pagamento
        await supabase
            .from('orders')
            .update({
                status: newOrderStatus,
                mp_payment_id: String(payment.id),
            })
            .eq('id', order.id)

        // Registra a transação
        await supabase.from('payment_transactions').insert({
            order_id: order.id,
            mp_payment_id: String(payment.id),
            amount: payment.transaction_amount,
            method: body.selectedPaymentMethod,
            status: paymentStatus,
            raw_data: payment as unknown as Record<string, unknown>,
        })

        // Se aprovado, decrementa o estoque
        if (paymentStatus === 'approved') {
            const { data: items } = await supabase
                .from('order_items')
                .select('variant_id, quantity')
                .eq('order_id', order.id)

            if (items && Array.isArray(items)) {
                for (const item of items) {
                    await supabase.rpc('decrement_stock', {
                        p_variant_id: item.variant_id,
                        p_qty: item.quantity,
                    })
                }
            }
        }

        return NextResponse.json({
            paymentId: payment.id,
            status: paymentStatus,
            orderStatus: newOrderStatus,
            // Para PIX, retorna o QR Code
            pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code,
            pixQrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
            // Para boleto, retorna a URL
            boletoUrl: payment.transaction_details?.external_resource_url,
        })
    } catch (error) {
        console.error('[process-payment] Erro MP:', error)
        return NextResponse.json(
            { error: 'Erro ao processar pagamento. Tente novamente.' },
            { status: 500 }
        )
    }
}
