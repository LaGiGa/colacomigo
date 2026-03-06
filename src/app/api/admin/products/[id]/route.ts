export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const VariantSchema = z.object({
    id: z.string().uuid().optional(),
    sku: z.string(),
    size: z.string().optional(),
    colorName: z.string().optional(),
    colorHex: z.string().optional(),
    priceDelta: z.number().default(0),
    stock: z.number().int().min(0).default(0),
})

const ImageSchema = z.object({
    id: z.string().uuid().optional(),
    url: z.string().url(),
    is_primary: z.boolean().default(false),
    position: z.number().int().default(0),
})

const UpdateProductSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    sku: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive(),
    compare_price: z.number().positive().optional(),
    category_id: z.string().uuid().optional(),
    brand_id: z.string().uuid().optional(),
    collection_id: z.string().uuid().nullable().optional(),
    weight_kg: z.number().positive().optional(),
    is_active: z.boolean().default(true),
    is_new: z.boolean().default(false),
    images: z.array(ImageSchema),
    variants: z.array(VariantSchema),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: product, error } = await supabase
        .from('products')
        .select(`
      *,
      images:product_images(*),
      variants:product_variants(*)
    `)
        .eq('id', id)
        .single()

    if (error || !product) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ product })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    let body: z.infer<typeof UpdateProductSchema>

    try {
        body = UpdateProductSchema.parse(await request.json())
    } catch (err: any) {
        return NextResponse.json({ error: 'Dados inválidos', details: err.errors }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Atualiza o produto
    const { error: productError } = await supabase
        .from('products')
        .update({
            name: body.name,
            slug: body.slug,
            sku: body.sku,
            description: body.description,
            price: body.price,
            compare_price: body.compare_price,
            category_id: body.category_id || null,
            brand_id: body.brand_id || null,
            collection_id: body.collection_id || null,
            weight_kg: body.weight_kg,
            is_active: body.is_active,
            is_new: body.is_new,
        })
        .eq('id', id)

    if (productError) {
        return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // 2. Atualiza Imagens (Abordagem simples: deleta atuais e insere novas ou merge)
    // Deletar imagens atuais
    await supabase.from('product_images').delete().eq('product_id', id)

    // Inserir novas
    if (body.images.length > 0) {
        await supabase.from('product_images').insert(
            body.images.map((img) => ({
                product_id: id,
                url: img.url,
                alt_text: body.name,
                is_primary: img.is_primary,
                position: img.position,
            }))
        )
    }

    // 3. Atualiza Variantes (Abordagem: Upsert ou Delete/Insert)
    // Deletar variantes não enviadas
    const sentVariantIds = body.variants.map(v => v.id).filter(Boolean) as string[]
    if (sentVariantIds.length > 0) {
        await supabase.from('product_variants').delete().eq('product_id', id).not('id', 'in', `(${sentVariantIds.join(',')})`)
    } else {
        await supabase.from('product_variants').delete().eq('product_id', id)
    }

    // Upsert variants
    for (const v of body.variants) {
        const variantData = {
            sku: v.sku,
            size: v.size || null,
            color_name: v.colorName || null,
            color_hex: v.colorHex || null,
            price: v.priceDelta || 0,
            stock: v.stock || 0,
            is_active: true
        }

        if (v.id) {
            await supabase
                .from('product_variants')
                .update(variantData)
                .eq('id', v.id)
        } else {
            await supabase
                .from('product_variants')
                .insert({
                    ...variantData,
                    product_id: id
                })
        }
    }

    return NextResponse.json({ success: true })
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
