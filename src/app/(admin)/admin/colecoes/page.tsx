import { createServiceClient } from '@/lib/supabase/server'
import { ColecoesAdminClient } from '@/components/admin/ColecoesAdminClient'
import { Layers } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coleções | Admin' }

export default async function AdminColecoesPage() {
    const supabase = createServiceClient()
    const { data: colecoes } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Coleções</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Agrupe produtos em coleções exibidas na loja (Nova Coleção, Inverno 2025...).
                    </p>
                </div>
            </div>
            <ColecoesAdminClient colecoes={colecoes ?? []} />
        </div>
    )
}
