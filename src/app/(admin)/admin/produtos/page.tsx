export const runtime = 'edge';
import { ProdutosAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminProductsPage() {
    return <ProdutosAdminClient products={[]} />
}
