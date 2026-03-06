import { notFound } from 'next/navigation'
export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { PedidoDetailClient } from '@/components/admin/AdminDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Detalhe do Pedido | Admin' }

interface Props {
    params: Promise<{ id: string }>
}

export default async function PedidoDetailPage({ params }: Props) {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      shipping_address:addresses(*),
      items:order_items(
        id, quantity, unit_price, total_price,
        variant:product_variants(
          sku, size, color_name,
          product:products(name, slug)
        )
      ),
      transactions:payment_transactions(
        id, mp_payment_id, amount, method, status, created_at
      ),
      shipment:shipments(
        id, tracking_code, carrier, status, shipped_at, delivered_at
      )
    `)
        .eq('id', id)
        .single()

    if (!order) notFound()

    return <PedidoDetailClient id={id} order={order} />
}
