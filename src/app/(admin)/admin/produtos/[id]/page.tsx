export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { ProductFormClient } from '@/components/admin/ProductFormClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Editar Produto | Admin' }

export default async function EditarProdutoPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createAdminClient()

    // Buscar categorias e marcas para o form
    const [
        { data: categories },
        { data: brands },
        { data: collections },
        { data: product }
    ] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('collections').select('id, name').order('name'),
        supabase.from('products')
            .select(`
                *,
                images:product_images(*),
                variants:product_variants(*)
            `)
            .eq('id', id)
            .single()
    ])

    if (!product) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Editar Produto</h1>
                <p className="text-muted-foreground mt-1">
                    Altere as informações, fotos e variantes do produto #{id.slice(0, 8).toUpperCase()}
                </p>
            </div>

            <ProductFormClient
                categories={categories ?? []}
                brands={brands ?? []}
                collections={collections ?? []}
                initialProduct={product}
            />
        </div>
    )
}
