export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mpCreatePreference } from '@/lib/mercadopago'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { items, customer, shipping, coupon } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Itens são obrigatórios' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: storeSettings } = await supabase.from('store_settings').select('*').eq('id', 1).single()
        
        let total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
        let discount = 0
        if (coupon) {
            if (coupon.discount_type === 'percentage') {
                discount = total * (coupon.discount_value / 100)
            } else {
                discount = coupon.discount_value
            }
        }
        
        const shippingPrice = shipping?.price || 0
        const finalTotal = total - discount + shippingPrice

        const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            total: finalTotal,
            status: 'pending',
            coupon_id: coupon?.id || null,
            discount_amount: discount,
            shipping_amount: shippingPrice,
            shipping_method: shipping?.name || 'Não selecionado'
        }).select().single()

        if (orderError) throw orderError

        const { error: itemsError } = await supabase.from('order_items').insert(
            items.map((it: any) => ({
                order_id: order.id,
                variant_id: it.variant_id,
                quantity: it.quantity,
                unit_price: it.price,
                total_price: it.price * it.quantity
            }))
        )
        if (itemsError) throw itemsError

        // Store Address
        const { error: addressError } = await supabase.from('addresses').insert({
            order_id: order.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            zip_code: customer.zipCode,
            street: customer.street,
            number: customer.number,
            complement: customer.complement,
            neighborhood: customer.neighborhood,
            city: customer.city,
            state: customer.state,
        })
        if (addressError) throw addressError

        const preference = await mpCreatePreference({
            id: order.id,
            items: items.map((it: any) => ({
                id: it.variant_id,
                title: it.name,
                unit_price: it.price,
                quantity: it.quantity
            })),
            customer: {
                name: customer.name,
                email: customer.email
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?orderId=${order.id}`,
                failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/erro?orderId=${order.id}`,
                pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pendente?orderId=${order.id}`
            }
        })

        return NextResponse.json({ id: preference.id, init_point: preference.init_point, orderId: order.id })
    } catch (err: any) {
        console.error('[API CHECKOUT PREFERENCE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
