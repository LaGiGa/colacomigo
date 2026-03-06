export const runtime = 'edge';
import { PedidoDetailClient } from '@/components/admin/AdminDynamicComponents'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params
  // Passamos id, e o componente no cliente busca os detalhes se vier orden vazio
  return <PedidoDetailClient id={id} order={null} />
}
