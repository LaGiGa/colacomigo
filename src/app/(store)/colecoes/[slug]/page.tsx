import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('collections').select('slug').eq('is_active', true)
    return data?.map((col) => ({ slug: col.slug })) || []
}

export default async function ColecaoPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = createServiceClient()

    const { data: colecao } = await supabase
        .from('collections')
        .select('id, name')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!colecao) notFound()

    return <ProdutosPageClient initialCollection={slug} />
}
