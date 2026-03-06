import { PedidoDetailClient } from '@/components/admin/AdminDynamicComponents'

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return []
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params
  return <PedidoDetailClient id={id} order={null} />
}
