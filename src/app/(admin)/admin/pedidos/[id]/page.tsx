export const runtime = 'nodejs'

import { PedidoDetailClient } from '@/components/admin/AdminDynamicComponents'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params
  return <PedidoDetailClient id={id} order={null} />
}
