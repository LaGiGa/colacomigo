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
    customerInfo: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        zipCode: z.string(),
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
    }),
    shippingCost: z.number().min(0),
    discount: z.number().min(0).default(0),
    profileId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
    let body: z.infer<typeof CreatePreferenceSchema>

    try {
        body = CreatePreferenceSchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json({ error: 'Payload inválido', details: err }, { status: 400 })
    }

    const supabase = createServiceClient()

    // ─── Calcula valores ─────────────────────────────────────────────
    const subtotal = body.items.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
    )
    const total = Math.max(0.01, subtotal + body.shippingCost - body.discount)

    // ─── 0. Cria ou usa o endereço no Supabase ───────────────────────
    // Para simplificar, sempre criaremos um novo registro de endereço por pedido
    const { data: address, error: addressError } = await supabase
        .from('addresses')
        .insert({
            user_id: body.profileId ?? null,
            name: body.customerInfo.name,
            phone: body.customerInfo.phone,
            zip_code: body.customerInfo.zipCode,
            street: body.customerInfo.street,
            number: body.customerInfo.number,
            complement: body.customerInfo.complement,
            neighborhood: body.customerInfo.neighborhood,
            city: body.customerInfo.city,
            state: body.customerInfo.state,
        })
        .select()
        .single()

    if (addressError || !address) {
        console.error('[create-preference] Erro ao criar endereço:', addressError)
        return NextResponse.json({ error: 'Erro ao salvar endereço' }, { status: 500 })
    }

    // ─── 1. Cria o pedido no Supabase (status: pending) ───────────────
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: body.profileId ?? null,
            address_id: address.id,
            status: 'pending',
            subtotal,
            shipping_cost: body.shippingCost,
            discount: body.discount,
            total,
            customer_name: body.customerInfo.name,
            customer_email: body.customerInfo.email,
            customer_phone: body.customerInfo.phone,
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
                items: [
                    ...body.items.map((item) => ({
                        id: item.variantId,
                        title: item.productName,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        currency_id: 'BRL',
                        picture_url: item.imageUrl,
                    })),
                    ...(body.discount > 0 ? [{
                        id: 'discount',
                        title: 'CUPOM DE DESCONTO',
                        quantity: 1,
                        unit_price: -body.discount,
                        currency_id: 'BRL',
                    }] : [])
                ],
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
