export const runtime = 'edge';
import { MarcasAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminBrandsPage() {
    return <MarcasAdminClient initialMarcas={[]} />
}
