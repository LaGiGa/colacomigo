import { createServiceClient } from '@/lib/supabase/server'
import { ProductFormClient } from '@/components/admin/ProductFormClient'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Novo Produto | Admin | Cola Comigo Shop' }

export default async function NovoProdutoPage() {
    const supabase = createServiceClient()

    const [{ data: categories }, { data: brands }, { data: collections }] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('collections').select('id, name').eq('is_active', true).order('sort_order'),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/produtos" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Novo Produto</h1>
                    <p className="text-muted-foreground text-sm">Preencha os dados e faça o upload das fotos</p>
                </div>
            </div>

            <ProductFormClient
                categories={categories ?? []}
                brands={brands ?? []}
                collections={collections ?? []}
            />
        </div>
    )
}
