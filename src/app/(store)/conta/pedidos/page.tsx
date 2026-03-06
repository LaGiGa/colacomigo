
import { ContaPedidosClient } from '@/components/store/StoreDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meus Pedidos | Cola Comigo Shop',
}

export default function MeusPedidosPage() {
    return <ContaPedidosClient />
}
