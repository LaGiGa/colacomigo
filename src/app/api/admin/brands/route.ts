
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ brands: data ?? [] })
}

export async function POST(req: Request) {
    const supabase = createServiceClient()
    const body = await req.json()

    const { data, error } = await supabase
        .from('brands')
        .insert([{ ...body, created_at: new Date().toISOString() }])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ brand: data })
}
