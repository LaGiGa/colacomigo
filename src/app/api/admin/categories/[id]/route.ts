
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params {
    params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const { id } = await params
    const body = await request.json()

    const supabase = createServiceClient()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.position !== undefined) updateData.sort_order = body.position // compatibilidade

    const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ category: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
    const { id } = await params

    const supabase = createServiceClient()

    // Verifica se há produtos nessa categoria
    const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id)

    if (count && count > 0) {
        return NextResponse.json(
            { error: `Não é possível excluir: ${count} produto(s) vinculado(s) a esta categoria.` },
            { status: 409 }
        )
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
