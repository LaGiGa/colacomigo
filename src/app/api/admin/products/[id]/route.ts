export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        
        const { error: productError } = await supabase.from('products').update({
            name: body.name, slug: body.slug, sku: body.sku, description: body.description,
            price: body.price, compare_price: body.compare_price, category_id: body.category_id || null,
            brand_id: body.brand_id || null, collection_id: body.collection_id || null,
            is_active: body.is_active,
        }).eq('id', id)
        if (productError) throw productError
        
        await supabase.from('product_images').delete().eq('product_id', id)
        if (body.images?.length > 0) {
            const { error: imagesError } = await supabase.from('product_images').insert(
                body.images.map((img: any) => ({ product_id: id, url: img.url, alt: body.name, is_primary: img.is_primary }))
            )
            if (imagesError) throw imagesError
        }
        
        // ─── Variantes: ATUALIZA, nunca apaga ────────────────────────────────
        // Apagar e recriar (comportamento antigo) gerava IDs novos a cada
        // edição: quebrava o vínculo dos pedidos antigos com o item vendido,
        // invalidava carrinhos salvos no navegador do cliente e zerava o
        // controle de estoque. Agora: atualiza as existentes, insere as novas
        // e apenas DESATIVA as que o admin removeu do formulário.
        const incoming = (body.variants ?? []) as any[]

        const { data: currentVariants, error: currentErr } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', id)
        if (currentErr) throw currentErr

        const currentIds = new Set((currentVariants ?? []).map((v) => v.id))
        const keptIds = new Set<string>()

        for (const variant of incoming) {
            const { id: variantId, ...fields } = variant

            if (variantId && currentIds.has(variantId)) {
                keptIds.add(variantId)
                const { error } = await supabase
                    .from('product_variants')
                    .update({ ...fields, product_id: id })
                    .eq('id', variantId)
                if (error) throw error
            } else {
                const { data: created, error } = await supabase
                    .from('product_variants')
                    .insert({ ...fields, product_id: id })
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
