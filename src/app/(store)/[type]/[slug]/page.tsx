export const runtime = 'edge'

import { notFound } from 'next/navigation'
import { ProdutosPageClient, ProductPageClient } from '@/components/store/StoreDynamicComponents'

export default async function GenericStorePage({
    params,
}: {
    params: Promise<{ type: string, slug: string }>
}) {
    const { type, slug } = await params

    switch (type) {
        case 'produtos':
            return <ProductPageClient slug={slug} />
        case 'categorias':
            return <ProdutosPageClient initialCategory={slug} />
        case 'colecoes':
            return <ProdutosPageClient initialCollection={slug} />
        case 'marcas':
            return <ProdutosPageClient initialMarca={slug} />
        default:
            notFound()
    }
}
