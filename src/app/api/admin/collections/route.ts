
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ collections: data ?? [] })
}

export async function POST(req: Request) {
    const body = await req.json()
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('collections').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ collection: data }, { status: 201 })
}
