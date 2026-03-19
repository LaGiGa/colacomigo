import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'

// Carregamento dinâmico para reduzir o bundle do servidor no Cloudflare
const ProductPageClient = dynamic(() => import('@/components/store/ProductPageClient').then(mod => mod.ProductPageClient), {
    loading: () => <div className="min-h-screen bg-black" />
})

const ProdutosPageClient = dynamic(() => import('@/components/store/ProdutosPageClient').then(mod => mod.ProdutosPageClient), {
    loading: () => <div className="min-h-screen bg-black" />
})

interface GenericStoreContentProps {
    type: 'produtos' | 'categorias' | 'marcas' | 'colecoes'
    slug: string
}

export async function GenericStoreContent({ type, slug }: GenericStoreContentProps) {
    const supabase = await createClient()

    // 1. Se for um produto individual
    if (type === 'produtos') {
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select(`
                id, name, slug, description, price, compare_price,
                images:product_images(url, is_primary),
                brand:brands(name, logo_url),
                category:categories(id, name, slug),
                variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
            `)
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()

        if (prodError) {
            console.error('GenericStoreContent [Product Error]:', prodError)
            return notFound()
        }

        if (prodData) {
            return (
                <ProductPageClient 
                    slug={slug}
                    initialProduct={prodData as any}
                />
            )
        }

        return notFound()
    }

    // 2. Se for uma listagem (Categorias, Marcas, Coleções)
    let query = supabase.from('products').select(`
        id, name, slug, price, compare_price,
        brand:brands(name),
        images:product_images(url, is_primary),
        variants:product_variants(id, sku, is_active, stock)
    `).eq('is_active', true)

    if (type === 'categorias') {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle()
        if (cat) query = query.eq('category_id', cat.id)
        else return notFound()
    } else if (type === 'marcas') {
        const { data: brand } = await supabase.from('brands').select('id').eq('slug', slug).maybeSingle()
        if (brand) query = query.eq('brand_id', brand.id)
        else return notFound()
    } else if (type === 'colecoes') {
        const { data: col } = await supabase.from('collections').select('id').eq('slug', slug).maybeSingle()
        if (col) query = query.eq('collection_id', col.id)
        else return notFound()
    }

    const { data: products } = await query.order('created_at', { ascending: false })

    return (
        <ProdutosPageClient 
            initialProducts={products || []}
            initialCategory={type === 'categorias' ? slug : null}
            initialCollection={type === 'colecoes' ? slug : null}
            initialMarca={type === 'marcas' ? slug : null}
            initialType={type}
            initialSlug={slug}
        />
    )
}
