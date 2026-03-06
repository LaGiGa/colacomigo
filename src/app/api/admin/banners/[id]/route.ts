
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

// PATCH /api/admin/banners/[id] — atualiza um banner
export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await req.json()

    const { data, error } = await supabase
        .from('hero_banners')
        .update({ ...body })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ banner: data })
}

// DELETE /api/admin/banners/[id] — exclui um banner
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
}
