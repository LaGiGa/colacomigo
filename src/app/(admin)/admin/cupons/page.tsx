export const runtime = 'edge';
import { createServiceClient } from '@/lib/supabase/server'
import { CuponsAdminClient } from '@/components/admin/AdminDynamicComponents'
import { Ticket } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cupons | Admin' }

export default async function AdminCuponsPage() {
    const supabase = createServiceClient()
    const { data: cupons } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Cupons</h1>
                    <p className="text-muted-foreground text-sm">Crie códigos de desconto para seus clientes</p>
                </div>
            </div>

            <CuponsAdminClient cupons={cupons || []} />
        </div>
    )
}
