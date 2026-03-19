export const runtime = 'edge'

import { notFound } from 'next/navigation'
import { ProdutosPageClient, ProductPageClient } from '@/components/store/StoreDynamicComponents'
import { createClient } from '@/lib/supabase/server'

export default async function GenericStorePage({
    params,
}: {
    params: Promise<{ type: string, slug: string }>
}) {
    const { type, slug } = await params
    const supabase = await createClient()

    // Se for um produto individual, o fluxo é diferente
    if (type === 'produtos') {
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select(`
                id, name, slug, description, price, compare_price, is_new,
                images:product_images(url, is_primary),
                brand:brands(name, logo_url),
                category:categories(id, name, slug),
                variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
            `)
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()

        if (prodError) {
            console.error('GenericStorePage [Product Error]:', prodError)
        }

        if (!prodData) notFound()

        return <ProductPageClient slug={slug} initialProduct={prodData as any} />
    }

    // Para listagens (Categorias, Coleções, Marcas), buscamos dados iniciais
    const [
        allCatsResponse,
        allBrandsResponse,
        allColsResponse
    ] = await Promise.all([
        supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('collections').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true })
    ])

    if (allCatsResponse.error) console.error('GenericStorePage [Cats Error]:', allCatsResponse.error)
    if (allBrandsResponse.error) console.error('GenericStorePage [Brands Error]:', allBrandsResponse.error)
    if (allColsResponse.error) console.error('GenericStorePage [Cols Error]:', allColsResponse.error)

    const allCategories = allCatsResponse.data
    const allBrands = allBrandsResponse.data
    const allCollections = allColsResponse.data

    let targetId: string | null = null
    let categorySlug: string | null = null
    let collectionSlug: string | null = null
    let brandSlug: string | null = null

    // Resolver o ID baseado no tipo
    if (type === 'categorias') {
        targetId = allCategories?.find(c => c.slug === slug)?.id || null
        categorySlug = slug
    } else if (type === 'colecoes') {
        targetId = allCollections?.find(c => c.slug === slug)?.id || null
        collectionSlug = slug
    } else if (type === 'marcas') {
        targetId = allBrands?.find(b => b.slug === slug)?.id || null
        brandSlug = slug
    }

    if (!targetId && type !== 'produtos') {
        notFound()
    }

    // Buscar os primeiros 20 produtos para o "Hype" inicial
    let query = supabase
        .from('products')
        .select(`
            id, name, slug, price, compare_price, is_new,
            brand:brands(name),
            images:product_images(url, is_primary),
            variants:product_variants(id, sku, is_active, stock)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

    if (type === 'categorias') query = query.eq('category_id', targetId)
    if (type === 'colecoes') query = query.eq('collection_id', targetId)
    if (type === 'marcas') query = query.eq('brand_id', targetId)

    const { data: initialProducts, error: prodError } = await query
    
    if (prodError) {
        console.error('GenericStorePage [List Product Error]:', prodError)
    }

    return (
        <ProdutosPageClient 
            initialCategory={categorySlug}
            initialCollection={collectionSlug}
            initialMarca={brandSlug}
            initialProducts={initialProducts || []}
            initialCategories={allCategories || []}
            initialBrands={allBrands || []}
            initialCollections={allCollections || []}
        />
    )
}

