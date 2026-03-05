import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import mercadopago from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import crypto from 'crypto'

/** Valida a assinatura HMAC SHA256 do Mercado Pago */
function validateMpSignature(request: NextRequest): boolean {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const secret = process.env.MP_WEBHOOK_SECRET

    if (!xSignature || !xRequestId || !secret) return false

    const params: Record<string, string> = {}
    xSignature.split(',').forEach((part) => {
        const [key, value] = part.trim().split('=')
        if (key && value) params[key] = value
    })

    const ts = params['ts']
    const v1 = params['v1']
    if (!ts || !v1) return false

    const url = new URL(request.url)
    const dataId = url.searchParams.get('data.id') ?? ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
}

function mapMpStatus(mpStatus: string): string {
    const map: Record<string, string> = {
        approved: 'paid',
        pending: 'awaiting_payment',
        in_process: 'awaiting_payment',
        rejected: 'cancelled',
        cancelled: 'cancelled',
        refunded: 'refunded',
        charged_back: 'refunded',
    }
    return map[mpStatus] ?? 'awaiting_payment'
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text()

    // ─── 1. Valida assinatura ────────────────────────────────────────
    if (!validateMpSignature(request)) {
        console.error('[MP Webhook] Assinatura inválida')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { type?: string; data?: { id?: string } }
    try {
        body = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (body.type !== 'payment' || !body.data?.id) {
        return NextResponse.json({ received: true })
    }

    const mpPaymentId = body.data.id

    try {
        // ─── 2. Consulta detalhes do pagamento ───────────────────────
        const payment = await new Payment(mercadopago).get({ id: mpPaymentId })
        const orderId = (payment.metadata as Record<string, string> | undefined)?.order_id
        if (!orderId) {
            return NextResponse.json({ received: true })
        }

        const newStatus = mapMpStatus(payment.status ?? 'pending')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createServiceClient()

        // ─── 3. Registra a transação ────────────────────────────────
        await supabase.from('payment_transactions').insert({
            order_id: orderId,
            mp_payment_id: String(mpPaymentId),
            amount: payment.transaction_amount ?? null,
            method: payment.payment_type_id ?? null,
            status: payment.status ?? null,
            raw_payload: payment as unknown as Record<string, unknown>,
        })

        // ─── 4. Atualiza status do pedido ───────────────────────────
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus, mp_payment_id: String(mpPaymentId) })
            .eq('id', orderId)

        if (error) {
            return NextResponse.json({ error: 'DB error' }, { status: 500 })
        }

        // ─── 5. Se pago, decrementa estoque ─────────────────────────
        if (newStatus === 'paid') {
            const { data: items } = await supabase
                .from('order_items')
                .select('variant_id, quantity')
                .eq('order_id', orderId)

            if (items && Array.isArray(items)) {
                for (const item of items) {
                    // A função decrement_stock deve ser criada no Supabase (SQL abaixo)
                    await supabase.rpc('decrement_stock', {
                        p_variant_id: item.variant_id,
                        p_qty: item.quantity,
                    })
                }
            }
        }

        console.log(`[MP Webhook] Pedido ${orderId} → ${newStatus}`)
        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[MP Webhook] Erro interno:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok' })
}
