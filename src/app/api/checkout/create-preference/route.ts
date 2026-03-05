import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import mercadopago from '@/lib/mercadopago'
import { Preference } from 'mercadopago'
import { z } from 'zod'

const CreatePreferenceSchema = z.object({
    items: z.array(
        z.object({
            variantId: z.string().uuid(),
            productName: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
            imageUrl: z.string().url().optional(),
        })
    ).min(1),
    shippingAddressId: z.string().uuid(),
    shippingCost: z.number().min(0),
    profileId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
    let body: z.infer<typeof CreatePreferenceSchema>

    try {
        body = CreatePreferenceSchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json({ error: 'Payload inválido', details: err }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceClient()

    // ─── Calcula valores ─────────────────────────────────────────────
    const subtotal = body.items.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
    )
    const total = subtotal + body.shippingCost

    // ─── 1. Cria o pedido no Supabase (status: pending) ───────────────
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            profile_id: body.profileId ?? null,
            shipping_address_id: body.shippingAddressId,
            status: 'pending',
            subtotal,
            shipping_cost: body.shippingCost,
            discount: 0,
            total,
        })
        .select()
        .single()

    if (orderError || !order) {
        console.error('[create-preference] Erro ao criar pedido:', orderError)
        return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    // ─── 2. Insere os itens do pedido ────────────────────────────────
    const orderItems = body.items.map((item) => ({
        order_id: order.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('[create-preference] Erro ao inserir itens:', itemsError)
        await supabase.from('orders').delete().eq('id', order.id)
        return NextResponse.json({ error: 'Erro ao criar itens do pedido' }, { status: 500 })
    }

    // ─── 3. Cria a Preference no Mercado Pago ────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const webhookUrl = `${appUrl}/api/webhooks/mercadopago`

    try {
        const preference = await new Preference(mercadopago).create({
            body: {
                items: body.items.map((item) => ({
                    id: item.variantId,
                    title: item.productName,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    currency_id: 'BRL',
                    picture_url: item.imageUrl,
                })),
                back_urls: {
                    success: `${appUrl}/checkout/sucesso`,
                    pending: `${appUrl}/checkout/pendente`,
                    failure: `${appUrl}/checkout`,
                },
                auto_return: 'approved',
                notification_url: webhookUrl,
                metadata: {
                    order_id: order.id,
                },
                payment_methods: {
                    installments: 12,
                },
            },
        })

        // ─── 4. Salva o preference_id no pedido ──────────────────────
        await supabase
            .from('orders')
            .update({ mp_preference_id: preference.id })
            .eq('id', order.id)

        return NextResponse.json({
            orderId: order.id,
            preferenceId: preference.id,
            initPoint: preference.init_point,
        })
    } catch (mpError) {
        console.error('[create-preference] Erro MP:', mpError)
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
        return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 })
    }
}
