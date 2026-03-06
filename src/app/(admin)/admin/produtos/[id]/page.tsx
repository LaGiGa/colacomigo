export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { ProductFormClient } from '@/components/admin/AdminDynamicComponents'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Editar Produto | Admin' }

export default async function EditarProdutoPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    // Busca produto com todas as relações
    const { data: product } = await supabase
        .from('products')
        .select(`
      *,
      images:product_images(id, url, position, is_primary),
      variants:product_variants(id, sku, size, color_name, color_hex, price, is_active, stock)
    `)
        .eq('id', id)
        .single()

    if (!product) notFound()

    // Busca categorias e marcas para o form
    const [categoriesRes, brandsRes] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name'),
    ])

    return (
        <ProductFormClient
            initialData={product}
            categories={categoriesRes.data || []}
            brands={brandsRes.data || []}
        />
    )
}
