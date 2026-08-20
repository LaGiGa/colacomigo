export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Valida um cupom e devolve o desconto correspondente.
 *
 * Esta rota serve apenas para a PRÉ-VISUALIZAÇÃO no checkout. O desconto que
 * realmente vale é recalculado em `/api/checkout/preference` na hora de criar
 * o pedido — aqui o cliente não decide nada sobre valor.
 *
 * Nomes de coluna conferem com o banco: uses_count / max_uses / min_order_value.
 */
export async function POST(req: Request) {
    try {
        const { code, total } = await req.json()
        if (!code) return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })

        const subtotal = Math.max(0, Number(total) || 0)

        const supabase = createServiceClient()
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', String(code).toUpperCase())
            .eq('is_active', true)
            .maybeSingle()

        if (error || !coupon) {
            return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 404 })
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
        }

        if (coupon.max_uses && (coupon.uses_count ?? 0) >= coupon.max_uses) {
            return NextResponse.json({ error: 'Limite de uso do cupom atingido' }, { status: 400 })
        }

        if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
            const minimo = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(Number(coupon.min_order_value))
            return NextResponse.json({ error: `Valor mínimo para este cupom é ${minimo}` }, { status: 400 })
        }

        // O painel grava 'percent'; bancos antigos podem ter 'percentage'.
        const isPercent = String(coupon.discount_type).toLowerCase().startsWith('percent')
        const discount = isPercent
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Number(coupon.discount_value)

        return NextResponse.json({
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: isPercent ? 'percent' : 'fixed',
                discount_value: coupon.discount_value,
                discount_amount: Number(Math.min(Math.max(0, discount), subtotal).toFixed(2)),
            },
        })
    } catch (err: any) {
        console.error('[API CHECKOUT COUPON ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
