import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'

export const runtime = 'edge';

export default async function CategoriaPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <ProdutosPageClient initialCategory={slug} />
}
