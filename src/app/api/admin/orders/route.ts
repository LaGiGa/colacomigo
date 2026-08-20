export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/orders
 *   ?limit=50        — quantos pedidos trazer (padrão 100, teto 200)
 *   ?status=paid     — filtra por status
 *   ?since=<ISO>     — só pedidos criados depois dessa data
 *   ?fields=lite     — payload enxuto, usado pelo sino de novas vendas
 *
 * O `select *` sem limite fazia o painel puxar a base inteira a cada 10s.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = createServiceClient()
        const { searchParams } = req.nextUrl

        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 200)
        const status = searchParams.get('status')
        const since = searchParams.get('since')
        const lite = searchParams.get('fields') === 'lite'

        const columns = lite
            ? 'id, status, total, created_at, customer_name, shipping_method, shipping_label'
            : '*, shipping_address:addresses!address_id(name, city, state), items:order_items(id)'

        let query = supabase
            .from('orders')
            .select(columns)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (status) query = query.eq('status', status)
        if (since) query = query.gte('created_at', since)

        const { data: orders, error } = await query
        if (error) throw error

        return NextResponse.json({ orders: orders ?? [] })
    } catch (err: any) {
        console.error('[API ADMIN ORDERS GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
