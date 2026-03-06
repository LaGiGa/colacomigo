export const runtime = 'edge';
import { CuponsAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminCouponsPage() {
    return <CuponsAdminClient initialCoupons={[]} />
}

