export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

/**
 * RECURSO CENTRALIZADO PARA REDUÇÃO DE BUNDLE (CLOUDFLARE 3MB LIMIT)
 * Este arquivo unifica todas as rotas da API Admin para compartilhar o mesmo Worker.
 */

// --- SCHEMAS ---
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

const ProductSchema = z.object({
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

const UpdateOrderSchema = z.object({
    status: z.string().optional(),
    trackingCode: z.string().optional(),
})

const RESOURCES: Record<string, string> = {
    banners: 'hero_banners',
    brands: 'brands',
    categories: 'categories',
    collections: 'collections',
    coupons: 'coupons',
    testimonials: 'testimonials',
    profiles: 'profiles',
    orders: 'orders'
}

const SINGULAR_MAP: Record<string, string> = {
    banners: 'banner',
    brands: 'brand',
    categories: 'category',
    collections: 'collection',
    coupons: 'coupon',
    products: 'product',
    testimonials: 'testimonial',
    profiles: 'profile',
    orders: 'order'
}

// --- GET DISPATCHER ---
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const { slug = [] } = await params
        const resource = slug[0]
        const id = slug[1]
        const supabase = createServiceClient()

        // 1. Recursos Especiais
        if (resource === 'financeiro') {
            const { data: orders, error } = await supabase.from('orders').select('id, total, status, created_at, items:order_items(id)').order('created_at', { ascending: false })
            if (error) throw error
            return NextResponse.json({ orders: orders ?? [] })
        }

        if (resource === 'products') {
            if (id) {
                const { data: product, error } = await supabase.from('products').select('*, images:product_images(*), variants:product_variants(*)').eq('id', id).single()
                if (error || !product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
                return NextResponse.json({ product })
            }
            const { data, error } = await supabase.from('products').select('*, category:categories(id, name), brand:brands(id, name), images:product_images(id, url, is_primary), variants:product_variants(*)').order('created_at', { ascending: false })
            if (error) throw error
            return NextResponse.json({ products: data ?? [] })
        }

        if (resource === 'orders' && id) {
            const { data: order, error } = await supabase.from('orders').select(`*, shipping_address:addresses(*), items:order_items(id, quantity, unit_price, total_price, variant:product_variants(sku, size, color_name, product:products(name, slug))), transactions:payment_transactions(id, mp_payment_id, amount, method, status, created_at), shipment:shipments(id, tracking_code, carrier, status, shipped_at, delivered_at)`).eq('id', id).single()
            if (error) throw error
            return NextResponse.json({ order })
        }

        if (resource === 'store-settings') {
            const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single()
            return NextResponse.json({ settings: data })
        }

        if (resource === 'shipping-settings') {
            const { data, error } = await supabase.from('shipping_settings').select('*').eq('id', 1).single()
            return NextResponse.json({ settings: data })
        }

        // 2. Recursos Genéricos
        const table = RESOURCES[resource]
        if (table) {
            if (id) {
                const { data, error } = await supabase.from(table as any).select('*').eq('id', id).single()
                if (error) throw error
                const key = SINGULAR_MAP[resource] || resource
                return NextResponse.json({ [key]: data })
            }

            const { data, error } = await supabase.from(table as any).select('*').order('created_at', { ascending: false })
            if (error) throw error
            return NextResponse.json({ [resource]: data ?? [] })
        }

        return NextResponse.json({ error: 'Endpoint não encontrado' }, { status: 404 })
    } catch (err: any) {
        console.error('[API ADMIN GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }

}

// --- POST DISPATCHER ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const { slug = [] } = await params
        const resource = slug[0]
        const id = slug[1]
        const action = slug[2]
        const supabase = createServiceClient()

        if (resource === 'upload') {
            const formData = await req.formData()
            const file = formData.get('file') as File
            const folder = (formData.get('folder') as string) ?? 'products'
            const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
            const { error } = await supabase.storage.from('cola-comigo').upload(filename, await file.arrayBuffer(), { contentType: file.type })
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('cola-comigo').getPublicUrl(filename)
            return NextResponse.json({ url: publicUrl, path: filename })
        }

        if (resource === 'orders' && id && action === 'send-tracking') {
            const { trackingCode } = await req.json()
            if (!trackingCode) throw new Error('Código de rastreio obrigatório')
            const adminSupabase = await createAdminClient()
            const { data: order } = await adminSupabase.from('orders').select('*, address:addresses(*)').eq('id', id).single()
            const { data: authUser } = await adminSupabase.auth.admin.getUserById(order.user_id)
            const customerEmail = authUser.user?.email
            if (!customerEmail) throw new Error('E-mail do cliente não encontrado')

            await sendEmail({
                to: customerEmail,
                subject: `Pedido enviado! Rastreio: ${trackingCode.toUpperCase()}`,
                html: `<h1>Pedido enviado!</h1><p>Código: ${trackingCode}</p>`
            })
            return NextResponse.json({ success: true })
        }

        if (resource === 'products') {
            const body = ProductSchema.parse(await req.json())
            const { data: product, error: productError } = await supabase.from('products').insert({
                name: body.name, slug: body.slug, sku: body.sku, description: body.description,
                price: body.price, compare_price: body.compare_price, category_id: body.category_id || null,
                brand_id: body.brand_id || null, collection_id: body.collection_id || null,
                weight_kg: body.weight_kg, is_active: body.is_active, is_new: body.is_new,
            }).select().single()
            if (productError) throw productError
            if (body.images.length > 0) await supabase.from('product_images').insert(body.images.map(img => ({ product_id: product.id, url: img.url, alt_text: body.name, is_primary: img.is_primary, position: img.position })))
            for (const v of body.variants) await supabase.from('product_variants').insert({
                product_id: product.id,
                sku: v.sku || `${product.id}-${Date.now()}`,
                size: v.size || null,
                color_name: v.colorName || null,
                color_hex: v.colorHex || null,
                price_delta: v.priceDelta,
                stock: v.stock,
                is_active: true
            })
            return NextResponse.json({ product }, { status: 201 })

        }

        const table = RESOURCES[resource]
        if (table) {
            const { data, error } = await supabase.from(table as any).insert(await req.json()).select().single()
            if (error) throw error
            const key = SINGULAR_MAP[resource] || resource
            return NextResponse.json({ [key]: data }, { status: 201 })
        }

        return NextResponse.json({ error: 'N/A' }, { status: 404 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// --- PUT/PATCH DISPATCHER ---
async function handleUpdate(req: NextRequest, slug: string[]) {
    try {
        const resource = slug[0]
        const id = slug[1]
        const supabase = createServiceClient()
        const body = await req.json()

        if (resource === 'products' && id) {
            const data = ProductSchema.parse(body)
            const { error: productError } = await supabase.from('products').update({
                name: data.name, slug: data.slug, sku: data.sku, description: data.description,
                price: data.price, compare_price: data.compare_price, category_id: data.category_id || null,
                brand_id: data.brand_id || null, collection_id: data.collection_id || null,
                weight_kg: data.weight_kg, is_active: data.is_active, is_new: data.is_new,
            }).eq('id', id)
            if (productError) throw productError
            await supabase.from('product_images').delete().eq('product_id', id)
            if (data.images.length > 0) await supabase.from('product_images').insert(data.images.map(img => ({ product_id: id, url: img.url, alt_text: data.name, is_primary: img.is_primary, position: img.position })))
            const sentVariantIds = data.variants.map(v => v.id).filter(Boolean) as string[]
            await supabase.from('product_variants').delete().eq('product_id', id).not('id', 'in', `(${sentVariantIds.join(',')})`)
            for (const v of data.variants) {
                const vData = {
                    sku: v.sku,
                    size: v.size || null,
                    color_name: v.colorName || null,
                    color_hex: v.colorHex || null,
                    price_delta: v.priceDelta || 0,
                    stock: v.stock || 0,
                    is_active: true
                }
                if (v.id) await supabase.from('product_variants').update(vData).eq('id', v.id)
                else await supabase.from('product_variants').insert({ ...vData, product_id: id })
            }

            return NextResponse.json({ success: true })
        }

        if (resource === 'orders' && id) {
            const data = UpdateOrderSchema.parse(body)
            if (data.status) await supabase.from('orders').update({ status: data.status }).eq('id', id)
            if (data.trackingCode) {
                const { data: existing } = await supabase.from('shipments').select('id').eq('order_id', id).single()
                if (existing) await supabase.from('shipments').update({ tracking_code: data.trackingCode, shipped_at: data.status === 'shipped' ? new Date().toISOString() : undefined }).eq('order_id', id)
                else await supabase.from('shipments').insert({ order_id: id, tracking_code: data.trackingCode, carrier: 'correios', status: 'shipped', shipped_at: new Date().toISOString() })
            }
            return NextResponse.json({ success: true })
        }

        if (resource === 'store-settings' || resource === 'shipping-settings') {
            const table = resource.replace('-', '_')
            const { data, error } = await supabase.from(table as any).update({ ...body, updated_at: new Date().toISOString() }).eq('id', 1).select().single()
            if (error) throw error
            return NextResponse.json({ settings: data })
        }

        const table = RESOURCES[resource]
        if (table && id) {
            const { data, error } = await supabase.from(table as any).update(body).eq('id', id).select().single()
            if (error) throw error
            const key = SINGULAR_MAP[resource] || resource
            return NextResponse.json({ [key]: data })
        }

        return NextResponse.json({ error: 'N/A' }, { status: 404 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    return handleUpdate(req, slug)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    return handleUpdate(req, slug)
}

// --- DELETE DISPATCHER ---
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const { slug = [] } = await params
        const resource = slug[0]
        const id = slug[1]
        const supabase = createServiceClient()
        if (!id) throw new Error('ID requerido')

        const table = resource === 'products' ? 'products' : RESOURCES[resource]
        if (table) {
            const { error } = await supabase.from(table as any).delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }
        return NextResponse.json({ error: 'N/A' }, { status: 404 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
