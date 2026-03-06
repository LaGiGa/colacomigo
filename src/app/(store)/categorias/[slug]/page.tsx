export const runtime = 'edge'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('categories').select('slug').eq('is_active', true)
    return data?.map((cat) => ({ slug: cat.slug })) || []
}

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
