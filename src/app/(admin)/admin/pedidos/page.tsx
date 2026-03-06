export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const PedidosAdminClient = dynamic(
    () => import('@/components/admin/PedidosAdminClient').then(mod => mod.PedidosAdminClient),
    { ssr: false, loading: () => <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando pedidos...</div> }
)

export const metadata: Metadata = { title: 'Pedidos | Admin' }

export default async function AdminPedidosPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: orders } = await supabase
        .from('orders')
        .select(`
      id, status, total, created_at, mp_payment_id,
      shipping_address:addresses(name, city, state),
      items:order_items(id)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    return <PedidosAdminClient orders={orders || []} />
}
