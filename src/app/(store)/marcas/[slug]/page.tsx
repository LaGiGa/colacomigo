import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'

export const runtime = 'edge';

export default async function MarcaPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <ProdutosPageClient initialMarca={slug} />
}
