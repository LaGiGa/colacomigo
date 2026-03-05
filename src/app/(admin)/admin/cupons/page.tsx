import { createServiceClient } from '@/lib/supabase/server'
import { CuponsAdminClient } from '@/components/admin/CuponsAdminClient'
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
                <Ticket className="h-5 w-5 text-primary" />
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Cupons de Desconto</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Crie cupons para seus clientes — percentual ou valor fixo.
                    </p>
                </div>
            </div>
            <CuponsAdminClient cupons={cupons ?? []} />
        </div>
    )
}
