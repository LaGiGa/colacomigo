export const runtime = 'edge';
import { CategoriasAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminCategoriesPage() {
    return <CategoriasAdminClient initialCategories={[]} />
}
