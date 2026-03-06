export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { ClientesAdminClient } from '@/components/admin/AdminDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clientes | Admin' }

export default async function AdminClientesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    return <ClientesAdminClient profiles={profiles || []} />
}
