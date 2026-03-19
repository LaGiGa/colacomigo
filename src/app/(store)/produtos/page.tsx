export const runtime = 'edge'

import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Todos os Produtos | Cola Comigo Shop',
    description: 'Camisas, Tênis, Bonés, Casacos e muito mais. Streetwear de qualidade.',
}

export default async function ProdutosPage({ searchParams }: { searchParams: { busca?: string } }) {
    const supabase = await createClient()
    const busca = (await searchParams)?.busca

    const [
        allCatsRes,
        allBrandsRes,
        allColsRes,
        initialProdsRes
    ] = await Promise.all([
        supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('collections').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
        (() => {
            let q = supabase.from('products').select(`
                id, name, slug, price, compare_price,
                brand:brands(name),
                images:product_images(url, is_primary),
                variants:product_variants(id, sku, is_active, stock)
            `).eq('is_active', true)
            
            if (busca) {
                q = q.ilike('name', `%${busca}%`)
            }
            
            return q.order('created_at', { ascending: false }).limit(20)
        })()
    ])

    if (allCatsRes.error) console.error('ProdutosPage [Cats Error]:', allCatsRes.error)
    if (allBrandsRes.error) console.error('ProdutosPage [Brands Error]:', allBrandsRes.error)
    if (allColsRes.error) console.error('ProdutosPage [Cols Error]:', allColsRes.error)
    if (initialProdsRes.error) console.error('ProdutosPage [Products Error]:', initialProdsRes.error)

    return (
        <ProdutosPageClient 
            initialProducts={initialProdsRes.data || []}
            initialCategories={allCatsRes.data || []}
            initialBrands={allBrandsRes.data || []}
            initialCollections={allColsRes.data || []}
            initialSearch={busca}
        />
    )
}
