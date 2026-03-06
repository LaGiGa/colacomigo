import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })
        }

        const supabase = createServiceClient()

        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single()

        if (error || !coupon) {
            return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 404 })
        }

        // Verifica expiração
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Este cupom já expirou' }, { status: 400 })
        }

        // Verifica limite de uso
        if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
            return NextResponse.json({ error: 'Este cupom atingiu o limite de uso' }, { status: 400 })
        }

        return NextResponse.json({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_value: coupon.min_order_value
        })

    } catch (error) {
        console.error('[validate-coupon] Erro:', error)
        return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 })
    }
}
