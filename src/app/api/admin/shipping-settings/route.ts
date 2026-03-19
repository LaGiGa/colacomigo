export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data, error } = await supabase.from('shipping_settings').select('*').eq('id', 1).single()
        if (error) throw error
        return NextResponse.json({ settings: data })
    } catch (err: any) {
        console.error('[API ADMIN SHIPPING SETTINGS ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        const { data, error } = await supabase.from('shipping_settings').update(body).eq('id', 1).select().single()
        if (error) throw error
        return NextResponse.json({ settings: data })
    } catch (err: any) {
        console.error('[API ADMIN SHIPPING SETTINGS PATCH ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
