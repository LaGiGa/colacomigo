import { ProductPageClient } from '@/components/store/ProductPageClient'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge';

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <ProductPageClient slug={slug} />
}

