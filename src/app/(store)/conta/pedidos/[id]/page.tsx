import { ContaPedidoDetalheClient } from '@/components/store/ContaPedidoDetalheClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Detalhe do Pedido | Cola Comigo Shop',
}

export default async function PedidoDetalhePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    return <ContaPedidoDetalheClient id={id} />
}

