export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendEmail, getPurchaseEmailHtml, getShippingEmailHtml, formatCurrencyString } from '@/lib/email'

/**
 * RECURSO CENTRALIZADO PARA REDUÇÃO DE BUNDLE (CLOUDFLARE 25MB LIMIT)
 */

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
    orders: 'order',
    'store-settings': 'settings',
    'shipping-settings': 'settings',
    stats: 'stats'
}

// --- GET DISPATCHER ---
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    const resource = slug[0]
    const id = slug[1]

    try {
        const supabase = createServiceClient()

        // 1. Recursos Especiais
        if (resource === 'financeiro' || resource === 'stats') {
            const { data: orders, error } = await supabase.from('orders').select('id, total, status, created_at, customer_name, customer_email').order('created_at', { ascending: false })
            if (error) throw error

            if (resource === 'stats') {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const paidOrders = orders?.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') ?? []
                const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length ?? 0
                const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0)

                const uniqueCustomers = new Set(orders?.map(o => o.customer_email).filter(Boolean)).size

                const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)

                const statusCounts = {
                    pending: orders?.filter(o => o.status === 'awaiting_payment' || o.status === 'pending').length ?? 0,
                    paid: orders?.filter(o => o.status === 'paid').length ?? 0,
                    preparing: orders?.filter(o => o.status === 'preparing').length ?? 0,
                    shipped: orders?.filter(o => o.status === 'shipped').length ?? 0,
                    delivered: orders?.filter(o => o.status === 'delivered').length ?? 0,
                }

                return NextResponse.json({
                    metrics: {
                        revenue: totalRevenue,
                        ordersToday: todayOrders,
                        customers: uniqueCustomers,
                        products: activeProducts ?? 0
                    },
                    statusCounts
                })
            }

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


        if (resource === 'orders' && !id) {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*, shipping_address:addresses!address_id(name, city, state), items:order_items(id)')
                .order('created_at', { ascending: false })
            if (error) throw error
            return NextResponse.json({ orders: orders ?? [] })
        }

        if (resource === 'orders' && id) {
            const { data: order, error } = await supabase.from('orders').select(`*, shipping_address:addresses!address_id(*), items:order_items(id, quantity, unit_price, total_price, variant:product_variants(sku, size, color_name, product:products(name, slug))), transactions:payment_transactions(id, mp_payment_id, amount, method, status, created_at), shipment:shipments(id, tracking_code, carrier, status, shipped_at, delivered_at)`).eq('id', id).single()
            if (error) throw error
            return NextResponse.json({ order })
        }


        if (resource === 'profiles') {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
            if (profilesError) throw profilesError

            const userIds = (profiles ?? []).map((profile) => profile.id)
            if (userIds.length === 0) return NextResponse.json({ profiles: [] })

            const [{ data: addresses }, { data: orders }] = await Promise.all([
                supabase
                    .from('addresses')
                    .select('id, user_id, city, state, street, number, neighborhood, zip_code, created_at')
                    .in('user_id', userIds)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('orders')
                    .select('user_id, customer_email, customer_name, customer_phone, created_at')
                    .in('user_id', userIds)
                    .order('created_at', { ascending: false }),
            ])

            const latestAddressByUser = new Map<string, any>()
            for (const addr of addresses ?? []) {
                if (addr.user_id && !latestAddressByUser.has(addr.user_id)) latestAddressByUser.set(addr.user_id, addr)
            }

            const latestOrderByUser = new Map<string, any>()
            for (const order of orders ?? []) {
                if (order.user_id && !latestOrderByUser.has(order.user_id)) latestOrderByUser.set(order.user_id, order)
            }

            const enrichedProfiles = (profiles ?? []).map((profile) => {
                const addr = latestAddressByUser.get(profile.id)
                const order = latestOrderByUser.get(profile.id)

                return {
                    ...profile,
                    full_name: profile.full_name || order?.customer_name || null,
                    phone: profile.phone || order?.customer_phone || null,
                    email: order?.customer_email || null,
                    city: addr?.city || null,
                    state: addr?.state || null,
                    address: addr || null,
                }
            })

            return NextResponse.json({ profiles: enrichedProfiles })
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
                if (error) {
                    console.error(`[API ADMIN GET ERROR] Failed on ${table}/${id}:`, error)
                    return NextResponse.json({ [SINGULAR_MAP[resource] || resource]: null, _error: error.message })
                }
                const key = SINGULAR_MAP[resource] || resource
                return NextResponse.json({ [key]: data })
            }

            const { data, error } = await supabase.from(table as any).select('*').order('created_at', { ascending: false })
            if (error) {
                console.error(`[API ADMIN GET ERROR] Failed listing ${table}:`, error)
                return NextResponse.json({ [resource]: [], _error: error.message })
            }
            return NextResponse.json({ [resource]: data ?? [] })
        }

        return NextResponse.json({ error: 'Endpoint não encontrado' }, { status: 404 })
    } catch (err: any) {
        console.error(`[API ADMIN GET CATCH] [${resource}]`, err)
        if (resource && (RESOURCES[resource] || ['products', 'financeiro', 'store-settings', 'shipping-settings'].includes(resource))) {
            return NextResponse.json({
                [resource]: [],
                _error: true,
                _message: err.message,
                _stack: err.stack
            })
        }
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}

// --- POST DISPATCHER ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    const resource = slug[0]
    const id = slug[1]

    try {
        const supabase = createServiceClient()

        if (resource === 'upload') {
            const formData = await req.formData()
            const file = formData.get('file') as File
            const folder = formData.get('folder') as string || 'uploads'
            if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

            const ext = file.name.split('.').pop()
            const fileName = `${crypto.randomUUID()}.${ext}`
            const filePath = `${folder}/${fileName}`
            const configuredBucket = (process.env.SUPABASE_STORAGE_BUCKET || '').trim()
            const bucketCandidates = Array.from(new Set([
                configuredBucket,
                'public',
                'products',
                'images',
            ].filter(Boolean)))

            let uploadedBucket: string | null = null
            let lastErrorMessage = 'Falha no upload'

            for (const bucket of bucketCandidates) {
                const { error } = await supabase.storage.from(bucket).upload(filePath, file)
                if (!error) {
                    uploadedBucket = bucket
                    break
                }
                lastErrorMessage = error.message
            }

            if (!uploadedBucket) {
                return NextResponse.json(
                    {
                        error: `Falha no upload. Buckets testados: ${bucketCandidates.join(', ')}. Último erro: ${lastErrorMessage}`,
                    },
                    { status: 500 }
                )
            }

            const { data: { publicUrl } } = supabase.storage.from(uploadedBucket).getPublicUrl(filePath)
            return NextResponse.json({ url: publicUrl, bucket: uploadedBucket })
        }

        if (resource === 'products') {
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
        }

        if (resource === 'orders' && slug[2] === 'send-email') {
            const orderId = id
            const { trackingCode } = await req.json()
            const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
            if (orderError || !order) throw orderError || new Error('Pedido não encontrado')

            const to = order.customer_email;
            if (!to) return NextResponse.json({ error: 'Pedido sem e-mail cadastrado' }, { status: 400 })

            if (trackingCode) {
                // Tracking Email
                await sendEmail({
                    to,
                    subject: `Oba! Seu pedido #${orderId.slice(0, 8).toUpperCase()} foi enviado! 🚀`,
                    html: getShippingEmailHtml(orderId, order.customer_name || 'Família', trackingCode)
                })
            } else {
                // Confirmation (Resend)
                const { data: items } = await supabase
                    .from('order_items')
                    .select('quantity, total_price, variant:product_variants(size, color_name, product:products(name))')
                    .eq('order_id', orderId);

                let itemsHtml = '';
                if (items) {
                    itemsHtml = items.map((it: any) => `
                        <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                            <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                            <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                            <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrencyString(it.total_price)}</p>
                        </div>
                    `).join('');
                }

                await sendEmail({
                    to,
                    subject: `Pagamento Confirmado! Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                    html: getPurchaseEmailHtml(orderId, order.customer_name || 'Família', itemsHtml, order.total || 0)
                })
            }

            return NextResponse.json({ success: true })
        }

        const table = RESOURCES[resource]
        if (table) {
            const body = await req.json()
            const { data, error } = await supabase.from(table).insert(body).select().single()
            if (error) throw error
            return NextResponse.json({ [SINGULAR_MAP[resource] || resource]: data })
        }

        return NextResponse.json({ error: 'Endpoint não encontrado' }, { status: 404 })
    } catch (err: any) {
        console.error(`[API ADMIN POST CATCH] [${resource}]`, err)
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}

// --- UPDATE / DELETE ---
async function handleUpdate(req: NextRequest, resource: string, id: string) {
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 })
    try {
        const supabase = createServiceClient()
        const table = resource === 'products' ? 'products' : resource === 'shipping-settings' ? 'shipping_settings' : resource === 'store-settings' ? 'store_settings' : RESOURCES[resource]
        if (!table) return NextResponse.json({ error: 'Recurso não suportado' }, { status: 404 })

        const body = await req.json()

        if (resource === 'orders') {
            const { trackingCode, ...orderUpdates } = body;
            const { data, error } = await supabase.from('orders').update(orderUpdates).eq('id', id).select().single()
            if (error) throw error

            if (trackingCode !== undefined) {
                if (trackingCode.trim() === '') {
                    // Optional: remove shipment or ignore
                } else {
                    const { data: existingShipment } = await supabase.from('shipments').select('id').eq('order_id', id).single();
                    if (existingShipment) {
                        await supabase.from('shipments').update({ tracking_code: trackingCode, status: orderUpdates.status === 'shipped' ? 'shipped' : 'preparing' }).eq('id', existingShipment.id);
                    } else {
                        await supabase.from('shipments').insert({ order_id: id, tracking_code: trackingCode, carrier: 'Correios', status: orderUpdates.status === 'shipped' ? 'shipped' : 'preparing', shipped_at: new Date().toISOString() });
                    }
                }
            }
            return NextResponse.json({ [SINGULAR_MAP[resource] || resource]: data })
        }

        if (resource === 'products') {
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
            await supabase.from('product_variants').delete().eq('product_id', id)
            const { error: variantsError } = await supabase.from('product_variants').insert(
                (body.variants ?? []).map((v: any) => {
                    const { id: _id, ...variantWithoutId } = v
                    return { ...variantWithoutId, product_id: id }
                })
            )
            if (variantsError) throw variantsError
            return NextResponse.json({ success: true })
        }

        const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single()
        if (error) throw error
        return NextResponse.json({ [SINGULAR_MAP[resource] || resource]: data })
    } catch (err: any) {
        console.error(`[API ADMIN UPDATE CATCH] [${resource}]`, err)
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    return handleUpdate(req, slug[0], slug[1])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    return handleUpdate(req, slug[0], slug[1])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params
    const resource = slug[0]
    const id = slug[1]
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 })

    try {
        const supabase = createServiceClient()
        const table = resource === 'products' ? 'products' : RESOURCES[resource]
        if (table) {
            const { error } = await supabase.from(table).delete().eq('id', id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }
        return NextResponse.json({ error: 'Recurso não suportado' }, { status: 404 })
    } catch (err: any) {
        console.error(`[API ADMIN DELETE CATCH] [${resource}]`, err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
