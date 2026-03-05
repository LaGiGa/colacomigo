import { createAdminClient } from '@/lib/supabase/server'
import { CategoriasAdminClient } from '@/components/admin/CategoriasAdminClient'
import { Tag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Categorias | Admin' }

export default async function AdminCategoriasPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: categorias } = await supabase
        .from('categories')
        .select('id, name, slug, description, is_active, sort_order, created_at')
        .order('sort_order', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-primary" />
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Categorias</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Gerencie as categorias da loja. Ative ou desative para controlar a exibição.
                    </p>
                </div>
            </div>

            <CategoriasAdminClient categorias={categorias ?? []} />
        </div>
    )
}
