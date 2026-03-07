import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createServiceClient()

        // Busca configurações de frete
        const { data: shippingSettings } = await supabase
            .from('shipping_settings')
            .select('*')
            .eq('id', 1)
            .single()

        // Busca configurações da loja
        const { data: storeSettings } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 1)
            .single()

        return NextResponse.json({
            shipping: shippingSettings,
            store: storeSettings
        })
    } catch (error: any) {
        console.error('[API STORE SETTINGS ERROR]:', error)
        return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 })
    }
}
