export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, shipping_address:addresses!address_id(name, city, state), items:order_items(id)')
            .order('created_at', { ascending: false })
        if (error) throw error
        return NextResponse.json({ orders: orders ?? [] })
    } catch (err: any) {
        console.error('[API ADMIN ORDERS GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
