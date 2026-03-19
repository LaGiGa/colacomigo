export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createMercadoPagoPreference } from '@/lib/api-lazy-loaders'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { items, customer, shipping, coupon } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Itens são obrigatórios' }, { status: 400 })
        }

        const supabase = createServiceClient()

        // Calculate totals
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
        let discount = 0
        if (coupon) {
            if (coupon.discount_type === 'percent') {
                discount = subtotal * (coupon.discount_value / 100)
            } else {
                discount = coupon.discount_value
            }
        }
        
        const shippingPrice = shipping?.price || 0
        const finalTotal = subtotal - discount + shippingPrice

        // 1. Create Address first
        const { data: address, error: addressError } = await supabase.from('addresses').insert({
            name: customer.name,
            phone: customer.phone,
            zip_code: customer.zipCode,
            street: customer.street,
            number: customer.number,
            complement: customer.complement,
            neighborhood: customer.neighborhood,
            city: customer.city,
            state: customer.state,
        }).select().single()

        if (addressError) {
            console.error('Address Error:', addressError)
            throw new Error(`Erro ao salvar endereço: ${addressError.message}`)
        }

        // 2. Create Order
        const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            subtotal: subtotal,
            discount: discount,
            shipping_cost: shippingPrice,
            total: finalTotal,
            status: 'pending',
            address_id: address.id
        }).select().single()

        if (orderError) {
            console.error('Order Error:', orderError)
            throw new Error(`Erro ao criar pedido: ${orderError.message}`)
        }

        // 3. Create Order Items
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

        // 4. Mercado Pago Preference
        const preference = await createMercadoPagoPreference({
            external_reference: order.id,
            items: items.map((it: any) => ({
                id: it.variant_id,
                title: it.name,
                unit_price: it.price,
                quantity: it.quantity
            })),
            payer: {
                name: customer.name,
                email: customer.email
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?orderId=${order.id}`,
                failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/erro?orderId=${order.id}`,
                pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pendente?orderId=${order.id}`
            }
        })

        // Update order with preference ID
        await supabase.from('orders').update({
            mp_preference_id: preference.id
        }).eq('id', order.id)

        return NextResponse.json({ id: preference.id, init_point: preference.init_point, orderId: order.id })
    } catch (err: any) {
        console.error('[API CHECKOUT PREFERENCE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
