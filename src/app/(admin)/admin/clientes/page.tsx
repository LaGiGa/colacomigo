export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const ClientesAdminClient = dynamic(
    () => import('@/components/admin/ClientesAdminClient').then(mod => mod.ClientesAdminClient),
    { ssr: false, loading: () => <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando clientes...</div> }
)

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
