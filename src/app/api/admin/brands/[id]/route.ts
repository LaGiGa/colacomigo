import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

// PATCH /api/admin/brands/[id] — atualiza uma marca
export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await req.json()

    const { data, error } = await supabase
        .from('brands')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ brand: data })
}

// DELETE /api/admin/brands/[id] — exclui uma marca
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase.from('brands').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
