import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const VariantSchema = z.object({
    sku: z.string(),
    size: z.string().optional(),
    colorName: z.string().optional(),
    colorHex: z.string().optional(),
    priceDelta: z.number().default(0),
})

const ImageSchema = z.object({
    url: z.string().url(),
    is_primary: z.boolean().default(false),
    position: z.number().int().default(0),
})

const CreateProductSchema = z.object({
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
    images: z.array(ImageSchema).min(1),
    variants: z.array(VariantSchema).min(1),
})

export async function POST(request: NextRequest) {
    let body: z.infer<typeof CreateProductSchema>

    try {
        body = CreateProductSchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json({ error: 'Dados inválidos', details: err }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceClient()

    // 1. Verifica se slug já existe
    const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', body.slug)
        .single()

    if (existing) {
        return NextResponse.json({ error: 'Já existe um produto com este slug. Altere o nome ou o slug.' }, { status: 409 })
    }

    // 2. Cria o produto
    const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
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
        .select()
        .single()

    if (productError) {
        return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // 3. Insere as imagens
    if (body.images.length > 0) {
        const { error: imagesError } = await supabase
            .from('product_images')
            .insert(
                body.images.map((img) => ({
                    product_id: product.id,
                    url: img.url,
                    alt_text: body.name,
                    is_primary: img.is_primary,
                    position: img.position,
                }))
            )
        if (imagesError) console.warn('[products] Erro ao inserir imagens:', imagesError)
    }

    // 4. Insere as variantes
    for (const v of body.variants) {
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .insert({
                product_id: product.id,
                sku: v.sku || `${body.sku ?? body.slug}-${Date.now()}`,
                size: v.size || null,
                color_name: v.colorName || null,
                color_hex: v.colorHex || null,
                price: v.priceDelta,
                is_active: true,
            })
            .select()
            .single()

        if (variantError) {
            console.warn('[products] Erro na variante:', variantError)
            continue
        }

        // Cria o registro de inventário (estoque inicial = 0)
        await supabase.from('inventory').insert({
            variant_id: variant.id,
            quantity: 0,
            reserved: 0,
        })
    }

    return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 })
}
