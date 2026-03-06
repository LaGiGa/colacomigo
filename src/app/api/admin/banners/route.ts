export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/banners — Lista todos os banners (incluindo inativos)
export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ banners: data ?? [] })
}

// POST /api/admin/banners — Cria um novo banner
export async function POST(req: Request) {
    const supabase = createServiceClient()
    const body = await req.json()

    // Garantir que temos um sort_order
    if (body.sort_order === undefined) {
        const { count } = await supabase
            .from('hero_banners')
            .select('*', { count: 'exact', head: true })
        body.sort_order = (count ?? 0) + 1
    }

    const { data, error } = await supabase
        .from('hero_banners')
        .insert([{ ...body, created_at: new Date().toISOString() }])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ banner: data })
}
