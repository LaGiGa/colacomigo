export const dynamic = 'force-dynamic';
// export const runtime = "edge";

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

        const { data: previous } = await supabase
            .from('orders')
            .select('status, stock_applied')
            .eq('id', id)
            .single()

        const { data, error } = await supabase.from('orders').update(orderUpdates).eq('id', id).select().single()
        if (error) throw error

        // ─── Estoque acompanha o status do pedido ────────────────────────────
        const newStatus = orderUpdates.status as string | undefined
        const wasCancelled = ['cancelled', 'refunded'].includes(previous?.status ?? '')
        const isCancelled = ['cancelled', 'refunded'].includes(newStatus ?? '')

        if (newStatus && isCancelled && !wasCancelled) {
            // Cancelou/estornou → devolve as peças para o estoque
            const { data: restored, error: restoreErr } = await supabase.rpc('restore_order_stock', { p_order_id: id })
            if (restoreErr) console.error('[ADMIN ORDER] Erro ao estornar estoque:', restoreErr)
            else console.log('[ADMIN ORDER] Estoque estornado:', id, restored)
        } else if (newStatus && !isCancelled && wasCancelled && previous?.stock_applied === false) {
            // Reabriu um pedido cancelado → tira do estoque de novo
            const { data: applied, error: applyErr } = await supabase.rpc('apply_order_stock', { p_order_id: id })
            if (applyErr) console.error('[ADMIN ORDER] Erro ao reaplicar baixa de estoque:', applyErr)
            else console.log('[ADMIN ORDER] Baixa reaplicada:', id, applied)
        }

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
