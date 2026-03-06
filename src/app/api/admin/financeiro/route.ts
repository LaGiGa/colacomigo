import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'



export async function GET() {
    try {
        const supabase = await createAdminClient() as any
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, total, status, created_at, items:order_items(id)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ orders: orders ?? [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
