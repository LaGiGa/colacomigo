import type { Metadata } from 'next'
import { ProdutosPageClient } from '@/components/store/ProdutosPageClient'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
    title: 'Todos os Produtos | Cola Comigo Shop',
    description: 'Camisas, TÃªnis, BonÃ©s, Casacos e muito mais. Streetwear de qualidade.',
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PRODUCT_SELECT = `
    *,
    brand:brands(name),
    images:product_images(url, is_primary),
    variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
`

export default async function ProdutosPage() {
    const supabase = createServiceClient()
    const [
        { data: products },
        { data: categories },
        { data: brands },
        { data: collections },
    ] = await Promise.all([
        supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('collections').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
    ])

    return (
        <ProdutosPageClient
            initialProducts={products ?? []}
            initialCategories={categories ?? []}
            initialBrands={brands ?? []}
            initialCollections={collections ?? []}
        />
    )
}
