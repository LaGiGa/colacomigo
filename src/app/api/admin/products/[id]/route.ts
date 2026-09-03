export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdminApi()
    if (authError) return authError

    const { id } = await params
    try {
        const supabase = createServiceClient()
        const { data: product, error } = await supabase.from('products').select('*, images:product_images(*), variants:product_variants(*)').eq('id', id).single()
        if (error || !product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        return NextResponse.json({ product })
    } catch (err: any) {
        console.error('[API ADMIN PRODUCT GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdminApi()
    if (authError) return authError

    const { id } = await params
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        
        const { error: productError } = await supabase.from('products').update({
            name: body.name,
            slug: body.slug,
            sku: body.sku || null,
            description: body.description || null,
            price: typeof body.price === 'number' ? body.price : parseFloat(body.price),
            compare_price: body.compare_price ? parseFloat(body.compare_price) : null,
            category_id: body.category_id || null,
            brand_id: body.brand_id || null,
            collection_id: body.collection_id || null,
            is_active: body.is_active ?? true,
        }).eq('id', id)
        if (productError) throw productError
        
        if (Array.isArray(body.images)) {
            await supabase.from('product_images').delete().eq('product_id', id)
            if (body.images.length > 0) {
                const { error: imagesError } = await supabase.from('product_images').insert(
                    body.images.map((img: any) => ({ product_id: id, url: img.url, alt: body.name, is_primary: img.is_primary }))
                )
                if (imagesError) throw imagesError
            }
        }
        
        // ─── Variantes: ATUALIZA, nunca apaga ────────────────────────────────
        const incoming = (body.variants ?? []) as any[]

        const { data: currentVariants, error: currentErr } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', id)
        if (currentErr) throw currentErr

        const currentIds = new Set((currentVariants ?? []).map((v) => v.id))
        const keptIds = new Set<string>()

        for (let i = 0; i < incoming.length; i++) {
            const variant = incoming[i]
            const { id: variantId, ...fields } = variant
            const cleanSlug = (body.slug || 'PROD').toUpperCase().replace(/[^A-Z0-9]/g, '')
            const cleanSize = (fields.size || 'UN').toUpperCase().replace(/[^A-Z0-9]/g, '')
            const autoSku = `${cleanSlug}-${cleanSize}-${i + 1}`

            const variantPayload = {
                ...fields,
                sku: fields.sku?.trim() || autoSku,
                size: fields.size?.trim() || null,
                color_name: fields.color_name?.trim() || null,
                color_hex: fields.color_hex || '#000000',
                product_id: id,
            }

            if (variantId && currentIds.has(variantId)) {
                keptIds.add(variantId)
                const { error } = await supabase
                    .from('product_variants')
                    .update(variantPayload)
                    .eq('id', variantId)
                if (error) throw error
            } else {
                const { data: created, error } = await supabase
                    .from('product_variants')
                    .insert(variantPayload)
                    .select('id')
                    .single()
                if (error) throw error
                if (created) keptIds.add(created.id)
            }
        }

        // Removidas no formulário → desativadas (o histórico de vendas continua íntegro)
        const removedIds = Array.from(currentIds).filter((variantId) => !keptIds.has(variantId))
        if (removedIds.length > 0) {
            const { error } = await supabase
                .from('product_variants')
                .update({ is_active: false })
                .in('id', removedIds)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[API ADMIN PRODUCT UPDATE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdminApi()
    if (authError) return authError

    const { id } = await params
    try {
        const supabase = createServiceClient()
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[API ADMIN PRODUCT DELETE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
