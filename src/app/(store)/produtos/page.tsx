
import { ProdutosPageClient } from '@/components/store/StoreDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Todos os Produtos | Cola Comigo Shop',
    description: 'Camisas, Tênis, Bonés, Casacos e muito mais. Streetwear de qualidade.',
}

export default function ProdutosPage() {
    return <ProdutosPageClient />
}
