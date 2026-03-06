export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
const MarcasAdminClient = dynamic(
    () => import('@/components/admin/MarcasAdminClient').then(mod => mod.MarcasAdminClient),
    { ssr: false, loading: () => <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando marcas...</div> }
)
import { Boxes } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Marcas | Admin' }

export default async function AdminMarcasPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: marcas } = await supabase
        .from('brands')
        .select('id, name, slug, description, logo_url, website, is_active, sort_order, created_at')
        .order('sort_order', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-primary" />
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Marcas</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Gerencie as marcas disponíveis na loja. Ative ou desative para controlar a exibição.
                    </p>
                </div>
            </div>

            <MarcasAdminClient marcas={marcas ?? []} />
        </div>
    )
}
