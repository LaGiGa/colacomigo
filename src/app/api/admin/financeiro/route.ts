export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const authError = await requireAdminApi()
    if (authError) return authError

    try {
        const supabase = createServiceClient()
        const { data: orders, error } = await supabase.from('orders').select('id, total, status, created_at, customer_name, customer_email').order('created_at', { ascending: false })
        if (error) throw error
        return NextResponse.json({ orders: orders ?? [] })
    } catch (err: any) {
        console.error('[API ADMIN FINANCEIRO ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
