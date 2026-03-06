import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'

export const runtime = 'edge';

export default async function CategoriaPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = createServiceClient()

    const { data: categoria } = await supabase
        .from('categories')
        .select('id, name')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!categoria) notFound()

    return <ProdutosPageClient initialCategory={slug} />
}
