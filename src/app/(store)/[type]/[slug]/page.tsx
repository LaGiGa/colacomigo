import { notFound } from 'next/navigation'
import { ProdutosPageClient } from '@/components/store/ProdutosPageClient'
import { ProductPageClient } from '@/components/store/ProductPageClient'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PRODUCT_SELECT = `
    *,
    brand:brands(name),
    images:product_images(url, is_primary),
    variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
`

const PRODUCT_PAGE_SELECT = `
    *,
    images:product_images(url, is_primary),
    brand:brands(name, logo_url),
    category:categories(id, name, slug),
    variants:product_variants(*)
`

async function getStoreFilters(supabase: ReturnType<typeof createServiceClient>) {
    const [{ data: categories }, { data: brands }, { data: collections }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('collections').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
    ])

    return {
        categories: categories ?? [],
        brands: brands ?? [],
        collections: collections ?? [],
    }
}

async function getProductsByFilter(
    supabase: ReturnType<typeof createServiceClient>,
    type: 'categorias' | 'colecoes' | 'marcas',
    slug: string
) {
    let query = supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)

    if (type === 'categorias') {
        const { data } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle()
        if (data?.id) query = query.eq('category_id', data.id)
        else return []
    }

    if (type === 'colecoes') {
        const { data } = await supabase.from('collections').select('id').eq('slug', slug).maybeSingle()
        if (data?.id) query = query.eq('collection_id', data.id)
        else return []
    }

    if (type === 'marcas') {
        const { data } = await supabase.from('brands').select('id').eq('slug', slug).maybeSingle()
        if (data?.id) query = query.eq('brand_id', data.id)
        else return []
    }

    const { data: products } = await query.order('created_at', { ascending: false })
    return products ?? []
}

export default async function GenericStorePage({
    params,
}: {
    params: Promise<{ type: string, slug: string }>
}) {
    const { type, slug } = await params
    const supabase = createServiceClient()

    switch (type) {
        case 'produtos': {
            const { data: product } = await supabase.from('products').select(PRODUCT_PAGE_SELECT).eq('slug', slug).maybeSingle()

            if (!product) {
                const { data: retryProduct } = await supabase.from('products').select(PRODUCT_PAGE_SELECT).ilike('slug', slug).maybeSingle()
                if (!retryProduct) notFound()
                return <ProductPageClient slug={slug} initialProduct={retryProduct} />
            }

            return <ProductPageClient slug={slug} initialProduct={product} />
        }
        case 'categorias':
        case 'colecoes':
        case 'marcas': {
            const [filters, products] = await Promise.all([
                getStoreFilters(supabase),
                getProductsByFilter(supabase, type, slug),
            ])

            return (
                <ProdutosPageClient
                    initialProducts={products}
                    initialCategories={filters.categories}
                    initialBrands={filters.brands}
                    initialCollections={filters.collections}
                    initialCategory={type === 'categorias' ? slug : null}
                    initialCollection={type === 'colecoes' ? slug : null}
                    initialMarca={type === 'marcas' ? slug : null}
                />
            )
        }
        default:
            notFound()
    }
}
