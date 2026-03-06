export const runtime = 'edge';
import { createServiceClient } from '@/lib/supabase/server'
import { ColecoesAdminClient } from '@/components/admin/AdminDynamicComponents'
import { Layers } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coleções | Admin' }

export default async function AdminColecoesPage() {
    const supabase = createServiceClient()
    const { data: colecoes } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Coleções</h1>
                    <p className="text-muted-foreground text-sm">Gerencie os drops e coleções exclusivas</p>
                </div>
            </div>

            <ColecoesAdminClient colecoes={colecoes || []} />
        </div>
    )
}
