export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const supabase = createServiceClient()
        const { data: order, error } = await supabase.from('orders').select(`*, shipping_address:addresses!address_id(*), items:order_items(id, quantity, unit_price, total_price, variant:product_variants(sku, size, color_name, product:products(name, slug))), transactions:payment_transactions(id, mp_payment_id, amount, method, status, created_at), shipment:shipments(id, tracking_code, carrier, status, shipped_at, delivered_at)`).eq('id', id).single()
        if (error) throw error
        return NextResponse.json({ order })
    } catch (err: any) {
        console.error('[API ADMIN ORDER GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        const { trackingCode, ...orderUpdates } = body;
        
        const { data, error } = await supabase.from('orders').update(orderUpdates).eq('id', id).select().single()
        if (error) throw error

        if (trackingCode !== undefined) {
            if (trackingCode.trim() !== '') {
                const { data: existingShipment } = await supabase.from('shipments').select('id').eq('order_id', id).single();
                if (existingShipment) {
                    await supabase.from('shipments').update({ tracking_code: trackingCode, status: orderUpdates.status === 'shipped' ? 'shipped' : 'preparing' }).eq('id', existingShipment.id);
                } else {
                    await supabase.from('shipments').insert({ order_id: id, tracking_code: trackingCode, carrier: 'Correios', status: orderUpdates.status === 'shipped' ? 'shipped' : 'preparing', shipped_at: new Date().toISOString() });
                }
            }
        }
        return NextResponse.json({ order: data })
    } catch (err: any) {
        console.error('[API ADMIN ORDER UPDATE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
