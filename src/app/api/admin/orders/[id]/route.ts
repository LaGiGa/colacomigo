export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateOrderSchema = z.object({
    status: z.string().optional(),
    trackingCode: z.string().optional(),
})

interface Params {
    params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const { id } = await params
    let body: z.infer<typeof UpdateOrderSchema>

    try {
        body = UpdateOrderSchema.parse(await request.json())
    } catch {
        return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Atualiza status do pedido
    if (body.status) {
        const { error } = await supabase
            .from('orders')
            .update({ status: body.status })
            .eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Atualiza ou cria o shipment com o código de rastreio
    if (body.trackingCode) {
        const { data: existing } = await supabase
            .from('shipments')
            .select('id')
            .eq('order_id', id)
            .single()

        if (existing) {
            await supabase
                .from('shipments')
                .update({
                    tracking_code: body.trackingCode,
                    shipped_at: body.status === 'shipped' ? new Date().toISOString() : undefined,
                })
                .eq('order_id', id)
        } else {
            await supabase.from('shipments').insert({
                order_id: id,
                tracking_code: body.trackingCode,
                carrier: 'correios',
                status: 'shipped',
                shipped_at: new Date().toISOString(),
            })
        }
    }

    return NextResponse.json({ success: true })
}

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            shipping_address:addresses(*),
            items:order_items(
                id, quantity, unit_price, total_price,
                variant:product_variants(
                    sku, size, color_name,
                    product:products(name, slug)
                )
            ),
            transactions:payment_transactions(
                id, mp_payment_id, amount, method, status, created_at
            ),
            shipment:shipments(
                id, tracking_code, carrier, status, shipped_at, delivered_at
            )
        `)
        .eq('id', id)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    return NextResponse.json({ order })
}
