import { notFound } from 'next/navigation'
// Reutilizamos StoreDynamicComponents para as vitrines (que já têm ssr: false e Loading state encapsulado)
// e adicionamos O MESMO TRATAMENTO CLÁSSICO
import { ProdutosPageClient, ProductPageClient } from '@/components/store/StoreDynamicComponents'

export const runtime = 'edge';

// Componente roteador unificado que substitui 4 arquivos independentes e remove MAIS DE 5MB DO SEU BUNDLE FREE!
export default async function GenericStorePage({
    params,
}: {
    params: Promise<{ type: string, slug: string }>
}) {
    const { type, slug } = await params

    // Roteamento baseado no primeiro segmento
    switch (type) {
        case 'produtos':
            // ProductPageClient importa o UI dele direto aqui pra ele ser rápido.
            // (Em server env sem DB-fetch o componente inicial é apenas uma "casca" que aciona o useEffect)
            return <ProductPageClient slug={slug} />
        case 'categorias':
            return <ProdutosPageClient initialCategory={slug} />
        case 'colecoes':
            return <ProdutosPageClient initialCollection={slug} />
        case 'marcas':
            return <ProdutosPageClient initialMarca={slug} />
        default:
            // Rota inválida? (por exemplo /foo/bar)
            notFound()
    }
}
