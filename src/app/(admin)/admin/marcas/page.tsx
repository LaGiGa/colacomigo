export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { MarcasAdminClient } from '@/components/admin/AdminDynamicComponents'
import { Boxes } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Marcas | Admin' }

export default async function AdminMarcasPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: marcas } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Boxes className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Marcas</h1>
                    <p className="text-muted-foreground text-sm">Gerencie as marcas parceiras da loja</p>
                </div>
            </div>

            <MarcasAdminClient marcas={marcas || []} />
        </div>
    )
}
