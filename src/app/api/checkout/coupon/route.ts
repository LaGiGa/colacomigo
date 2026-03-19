export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { code, total } = await req.json()
        if (!code) return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })

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

        const now = new Date()
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
            return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
        }

        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return NextResponse.json({ error: 'Limite de uso do cupom atingido' }, { status: 400 })
        }

        if (coupon.min_purchase_value && total < coupon.min_purchase_value) {
            return NextResponse.json({ error: `Valor mínimo para este cupom é R$ ${coupon.min_purchase_value}` }, { status: 400 })
        }

        let discount = 0
        if (coupon.discount_type === 'percentage') {
            discount = total * (coupon.discount_value / 100)
        } else {
            discount = coupon.discount_value
        }

        return NextResponse.json({
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                discount_amount: discount
            }
        })
    } catch (err: any) {
        console.error('[API CHECKOUT COUPON ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
