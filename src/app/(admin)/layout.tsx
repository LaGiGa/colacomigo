import { AdminLayoutClient } from '@/components/admin/AdminDynamicComponents'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
