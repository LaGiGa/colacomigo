export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { BannersAdminClient } from '@/components/admin/BannersAdminClient'
import { Layout } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Banners | Admin' }

export default async function AdminBannersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: banners } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Layout className="h-5 w-5 text-primary" />
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Banners do Carrossel</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Gerencie as imagens e textos que aparecem no destaque da página inicial.
                    </p>
                </div>
            </div>

            <BannersAdminClient banners={banners ?? []} />
        </div>
    )
}
