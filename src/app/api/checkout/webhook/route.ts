export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { getMercadoPagoPayment } from '@/lib/api-lazy-loaders'
import { fulfillPaidOrder } from '@/lib/orders/fulfill'

/**
 * Valida a assinatura do webhook do Mercado Pago (header `x-signature`).
 *
 * O manifesto é `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` assinado com
 * HMAC-SHA256 usando a chave secreta do webhook (painel do Mercado Pago →
 * Suas integrações → Webhooks → Chave secreta).
 *
 * Se MP_WEBHOOK_SECRET não estiver configurada, apenas registra um aviso e
 * deixa passar — assim a validação pode ser ativada sem downtime.
 */
async function isValidSignature(req: Request, dataId: string | null): Promise<boolean> {
    const secret = process.env.MP_WEBHOOK_SECRET
    if (!secret) {
        console.warn('[MP WEBHOOK] MP_WEBHOOK_SECRET não configurada — assinatura não verificada.')
        return true
    }

    const signature = req.headers.get('x-signature')
    const requestId = req.headers.get('x-request-id') || ''
    if (!signature || !dataId) return false

    const parts = Object.fromEntries(
        signature.split(',').map((p) => {
            const [k, ...v] = p.split('=')
            return [k.trim(), v.join('=').trim()]
        })
    ) as { ts?: string; v1?: string }

    if (!parts.ts || !parts.v1) return false

    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
    const expected = Array.from(new Uint8Array(signed))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

    // Comparação de tempo constante
    if (expected.length !== parts.v1.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i)
    return diff === 0
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const body = await req.json().catch(() => ({}))

        const type = url.searchParams.get('type') || body.type
        const dataId = url.searchParams.get('data.id') || body.data?.id || null

        console.log('[MP WEBHOOK RAW]', {
            type,
            dataId,
            queryParams: Object.fromEntries(url.searchParams.entries()),
            bodyKeys: Object.keys(body),
        })

        if (!(await isValidSignature(req, dataId ? String(dataId) : null))) {
            console.error('[MP WEBHOOK] Assinatura inválida — requisição recusada.')
            return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }

        if (type !== 'payment' || !dataId) {
            return NextResponse.json({ received: true })
        }

        const payment = await getMercadoPagoPayment(dataId)
        console.log('[MP WEBHOOK PAYMENT]', {
            id: payment.id,
            status: payment.status,
            method: payment.payment_method_id,
            external_ref: payment.external_reference,
        })

        if (payment.status !== 'approved') {
            console.log('[MP WEBHOOK] Pagamento não aprovado:', payment.status)
            return NextResponse.json({ received: true })
        }

        const orderId = payment.metadata?.order_id || payment.external_reference
        if (!orderId) {
            console.error('[MP WEBHOOK] Sem order_id no metadata nem no external_reference')
            return NextResponse.json({ received: true })
        }

        // Baixa de estoque + e-mails + WhatsApp da loja, tudo idempotente.
        const result = await fulfillPaidOrder({
            orderId,
            paymentId: payment.id,
            paymentMethod: payment.payment_method_id,
            source: 'webhook',
        })

        return NextResponse.json({ received: true, result })
    } catch (err: any) {
        console.error('[API CHECKOUT WEBHOOK ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
