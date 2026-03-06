export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase/server'
import { BannersAdminClient } from '@/components/admin/AdminDynamicComponents'
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
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layout className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Banners</h1>
                    <p className="text-muted-foreground text-sm">Gerencie os banners do carrossel principal</p>
                </div>
            </div>

            <BannersAdminClient banners={banners || []} />
        </div>
    )
}
