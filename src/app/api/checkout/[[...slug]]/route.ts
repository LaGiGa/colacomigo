// export const runtime = 'edge'; // Removed due to node:buffer usage
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { mpCreatePreference, mpCreatePayment, mpGetPayment } from '@/lib/mercadopago'
import { sendEmail } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'
import { z } from 'zod'

/**
 * RECURSO CENTRALIZADO PARA REDUÇÃO DE BUNDLE (CLOUDFLARE 3MB LIMIT)
 * Este arquivo unifica todas as rotas da API Checkout e Webhooks para compartilhar o mesmo Worker/Boilerplate.
 */

const ShippingSchema = z.object({
    cepDestino: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos (sem hífen)'),
    itens: z.array(z.object({
        quantity: z.number().int().positive(),
        weightKg: z.number().positive().default(0.3),
        heightCm: z.number().positive().default(2),
        widthCm: z.number().positive().default(15),
        lengthCm: z.number().positive().default(20),
    })).min(1),
})

const CreatePreferenceSchema = z.object({
    items: z.array(z.any()),
    addressId: z.string().uuid(),
    paymentMethod: z.string(),
    coupon: z.string().optional(),
    shippingCost: z.number().default(0),
    shippingMethod: z.string().optional(),
})

const ProcessPaymentSchema = z.object({
    preferenceId: z.string(),
    selectedPaymentMethod: z.string(),
    formData: z.record(z.string(), z.unknown()),
})

// --- HELPERS ---
async function validateMpSignature(request: NextRequest): Promise<boolean> {
    const xSignature = request.headers.get('x-signature'), xRequestId = request.headers.get('x-request-id'), secret = process.env.MP_WEBHOOK_SECRET
    if (!xSignature || !xRequestId || !secret) return false
    const params: any = {}; xSignature.split(',').forEach(p => { const [k, v] = p.trim().split('='); if (k && v) params[k] = v })
    const url = new URL(request.url), dataId = url.searchParams.get('data.id') ?? '', manifest = `id:${dataId};request-id:${xRequestId};ts:${params.ts};`
    const encoder = new TextEncoder(), key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('') === params.v1
}

// --- MAIN DISPATCHER ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const { slug = [] } = await params; const action = slug[0]; const supabase = createServiceClient()

        // 1. CÁLCULO DE FRETE
        if (action === 'shipping') {
            const body = ShippingSchema.parse(await req.json()); const totalWeight = body.itens.reduce((s, i) => s + (i.weightKg * i.quantity), 0)
            const { Buffer } = await import('node:buffer')
            const auth = Buffer.from(`${process.env.CORREIOS_USER}:${process.env.CORREIOS_PASSWORD}`).toString('base64')
            const tokenRes = await fetch('https://api.correios.com.br/token/v1/autentica/cartaopostagem', {
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + auth,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numero: process.env.CORREIOS_NUMERO_CARTAO_POSTAGEM })
            })
            if (!tokenRes.ok) return NextResponse.json({ options: [] })
            const { token } = await tokenRes.json()
            const precoRes = await fetch(`https://api.correios.com.br/preco/v1/nacional/03298,03220?cepOrigem=${process.env.CORREIOS_CEP_ORIGEM ?? '77006002'}&cepDestino=${body.cepDestino}&psObjeto=${Math.ceil(totalWeight * 1000)}&tpObjeto=2&comprimento=20&largura=15&altura=5`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await precoRes.json()
            const options = (Array.isArray(data) ? data : []).map(s => ({ serviceName: s.coProduto === '03298' ? 'PAC' : 'SEDEX', carrier: s.coProduto === '03298' ? 'correios_pac' : 'correios_sedex', price: parseFloat(s.pcFinal?.replace(',', '.') ?? '0'), estimatedDays: parseInt(s.prazoEntrega ?? '7') })).filter(o => o.price > 0)
            return NextResponse.json({ options })
        }

        // 2. VALIDAÇÃO DE CUPOM
        if (action === 'coupon-validate') {
            const { code } = await req.json()
            const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
            if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) < new Date()) || (coupon.max_uses && coupon.uses_count >= coupon.max_uses)) return NextResponse.json({ error: 'Inválido' }, { status: 404 })
            return NextResponse.json({ code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value, min_order_value: coupon.min_order_value })
        }

        // 3. CRIAÇÃO DE PREFERÊNCIA
        if (action === 'create-preference') {
            const body = CreatePreferenceSchema.parse(await req.json()); const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '')
            const preference = await mpCreatePreference({ items: body.items, back_urls: { success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`, failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/erro` }, auto_return: 'approved' })
            const { data: order } = await supabase.from('orders').insert({ user_id: user?.id, total: body.items.reduce((n: any, i: any) => n + (i.unit_price * i.quantity), 0) + body.shippingCost, status: 'awaiting_payment', mp_preference_id: preference.id }).select().single()
            return NextResponse.json({ preferenceId: preference.id, orderId: order.id, initPoint: preference.init_point })
        }

        // 4. PROCESSAMENTO DE PAGAMENTO (Checkout Transparente)
        if (action === 'process-payment') {
            const body = ProcessPaymentSchema.parse(await req.json()); const { data: order } = await supabase.from('orders').select('*').eq('mp_preference_id', body.preferenceId).single()
            const payment = await mpCreatePayment({ ...body.formData, transaction_amount: order.total, metadata: { order_id: order.id }, notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/webhook` })
            const status = payment.status === 'approved' ? 'paid' : (payment.status === 'rejected' ? 'cancelled' : 'awaiting_payment')
            await supabase.from('orders').update({ status, mp_payment_id: String(payment.id) }).eq('id', order.id)
            await supabase.from('payment_transactions').insert({ order_id: order.id, mp_payment_id: String(payment.id), amount: payment.transaction_amount, method: body.selectedPaymentMethod, status: payment.status, raw_data: payment })
            return NextResponse.json({ paymentId: payment.id, status: payment.status, orderStatus: status })
        }

        // 5. WEBHOOK MERCADO PAGO
        if (action === 'webhook') {
            if (!(await validateMpSignature(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const body = await req.json(); if (body.type !== 'payment' || !body.data?.id) return NextResponse.json({ received: true })
            const payment = await mpGetPayment(body.data.id); const orderId = (payment.metadata as any)?.order_id; if (!orderId) return NextResponse.json({ received: true })
            const status = payment.status === 'approved' ? 'paid' : (payment.status === 'rejected' ? 'cancelled' : 'awaiting_payment')
            await supabase.from('orders').update({ status, mp_payment_id: String(body.data.id) }).eq('id', orderId)
            await supabase.from('payment_transactions').insert({ order_id: orderId, mp_payment_id: String(body.data.id), amount: payment.transaction_amount, method: payment.payment_type_id, status: payment.status, raw_data: payment })
            if (status === 'paid') {
                const { data: items } = await supabase.from('order_items').select('variant_id, quantity').eq('order_id', orderId)
                if (items) for (const it of items) await supabase.rpc('decrement_stock', { p_variant_id: it.variant_id, p_qty: it.quantity })
                const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single()
                if (orderData.customer_email) await sendEmail({ to: orderData.customer_email, subject: `Pagamento Confirmado! #${orderId.slice(0, 8).toUpperCase()}`, html: `<h1>Valeu!</h1><p>Pagamento de ${formatCurrency(orderData.total)} confirmado.</p>` })
            }
            return NextResponse.json({ received: true })
        }

        return NextResponse.json({ error: 'N/A' }, { status: 404 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() { return NextResponse.json({ status: 'ok' }) }
