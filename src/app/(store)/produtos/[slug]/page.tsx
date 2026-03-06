import { ProductPageClient } from '@/components/store/StoreDynamicComponents'

export const runtime = 'edge';

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <ProductPageClient slug={slug} />
}
