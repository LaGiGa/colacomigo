export const runtime = 'edge'
import { ProductPageClient } from '@/components/store/ProductPageClient'
import { createServiceClient } from '@/lib/supabase/server'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('products').select('slug').eq('is_active', true)
    return data?.map((p) => ({ slug: p.slug })) || []
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <ProductPageClient slug={slug} />
}

