export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { ProdutosAdminClient } from '@/components/admin/AdminDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos | Admin' }

export default async function AdminProdutosPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: products } = await supabase
        .from('products')
        .select(`
      id, name, slug, price, compare_price, is_active, sku, collection,
      brand:brands(name),
      category:categories(name),
      images:product_images(url, is_primary),
      variants:product_variants(id, is_active)
    `)
        .order('created_at', { ascending: false })

    return <ProdutosAdminClient products={products || []} />
}
