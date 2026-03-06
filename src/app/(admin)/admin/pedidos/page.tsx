export const runtime = 'edge';
import { PedidosAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminOrdersPage() {
    return <PedidosAdminClient initialOrders={[]} />
}
