export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data: orders, error } = await supabase.from('orders').select('id, total, status, created_at, customer_name, customer_email').order('created_at', { ascending: false })
        if (error) throw error

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const paidOrders = orders?.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') ?? []
        const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length ?? 0
        const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0)

        const uniqueCustomers = new Set(orders?.map(o => o.customer_email).filter(Boolean)).size

        const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)

        const statusCounts = {
            pending: orders?.filter(o => o.status === 'awaiting_payment' || o.status === 'pending').length ?? 0,
            paid: orders?.filter(o => o.status === 'paid').length ?? 0,
            preparing: orders?.filter(o => o.status === 'preparing').length ?? 0,
            shipped: orders?.filter(o => o.status === 'shipped').length ?? 0,
            delivered: orders?.filter(o => o.status === 'delivered').length ?? 0,
        }

        return NextResponse.json({
            metrics: {
                revenue: totalRevenue,
                ordersToday: todayOrders,
                customers: uniqueCustomers,
                products: activeProducts ?? 0
            },
            statusCounts
        })
    } catch (err: any) {
        console.error('[API ADMIN STATS ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
