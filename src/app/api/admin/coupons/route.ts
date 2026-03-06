
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ coupons: data ?? [] })
}

export async function POST(req: Request) {
    const body = await req.json()
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('coupons').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ coupon: data }, { status: 201 })
}
