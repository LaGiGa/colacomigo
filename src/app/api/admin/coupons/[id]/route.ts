import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await req.json()
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('coupons').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ coupon: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = createServiceClient()
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
}
