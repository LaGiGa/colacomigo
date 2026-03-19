export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ProductSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    sku: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0),
    compare_price: z.number().optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    brand_id: z.string().uuid().optional().nullable(),
    collection_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().default(true),
    images: z.array(z.object({
        url: z.string().url(),
        is_primary: z.boolean().default(false)
    })).default([]),
    variants: z.array(z.object({
        id: z.string().uuid().optional(),
        sku: z.string().optional(),
        size: z.string().optional(),
        color_name: z.string().optional(),
        color_hex: z.string().optional(),
        price_delta: z.number().default(0),
        stock: z.number().int().min(0).default(0),
        is_active: z.boolean().default(true),
    })).min(1, 'Produto deve ter ao menos uma variante').default([])
})

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data, error } = await supabase.from('products').select('*, category:categories(id, name), brand:brands(id, name), images:product_images(id, url, is_primary), variants:product_variants(*)').order('created_at', { ascending: false })
        if (error) throw error
        return NextResponse.json({ products: data ?? [] })
    } catch (err: any) {
        console.error('[API ADMIN PRODUCTS GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createServiceClient()
        const body = ProductSchema.parse(await req.json())
        const { data: product, error: productError } = await supabase.from('products').insert({
            name: body.name, slug: body.slug, sku: body.sku, description: body.description,
            price: body.price, compare_price: body.compare_price, category_id: body.category_id || null,
            brand_id: body.brand_id || null, collection_id: body.collection_id || null,
            is_active: body.is_active,
        }).select().single()
        if (productError) throw productError
        
        if (body.images.length > 0) {
            const { error: imagesError } = await supabase.from('product_images').insert(
                body.images.map(img => ({ product_id: product.id, url: img.url, alt: body.name, is_primary: img.is_primary }))
            )
            if (imagesError) {
                await supabase.from('products').delete().eq('id', product.id)
                throw imagesError
            }
        }
        
        const { error: variantsError } = await supabase.from('product_variants').insert(
            body.variants.map((v: any) => {
                const { id: _id, ...variantWithoutId } = v
                return { ...variantWithoutId, product_id: product.id }
            })
        )
        if (variantsError) {
            await supabase.from('products').delete().eq('id', product.id)
            throw variantsError
        }
        return NextResponse.json({ product })
    } catch (err: any) {
        console.error('[API ADMIN PRODUCTS POST ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
