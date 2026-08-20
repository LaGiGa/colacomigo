export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Cotação de frete dos Correios via Melhor Envio.
 *
 * Devolve as opções no MESMO formato que o `ShippingCalculator` consome:
 *   { serviceName, carrier, price, estimatedDays }
 */

interface ShippingOptionOut {
    serviceName: string
    carrier: 'pac' | 'sedex'
    price: number
    estimatedDays: number
}

const FALLBACK_OPTIONS: ShippingOptionOut[] = [
    { serviceName: 'PAC (Correios)', carrier: 'pac', price: 25.9, estimatedDays: 7 },
    { serviceName: 'SEDEX (Correios)', carrier: 'sedex', price: 45.9, estimatedDays: 3 },
]

/** Identifica o serviço pelo nome retornado pelo Melhor Envio. */
function detectCarrier(name: string): 'pac' | 'sedex' | null {
    const upper = name.toUpperCase()
    if (upper.includes('SEDEX')) return 'sedex'
    if (upper.includes('PAC')) return 'pac'
    return null
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        // O front histórico envia `itens`; aceitamos as duas grafias.
        const { cepOrigem, cepDestino } = body
        const items = body.items ?? body.itens ?? []

        if (!cepDestino || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'CEP de destino e itens são obrigatórios' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: settings } = await supabase.from('shipping_settings').select('*').eq('id', 1).single()

        if (settings && settings.correios_enabled === false) {
            return NextResponse.json({ options: [] })
        }

        const originCep = String(cepOrigem || settings?.correios_cep_origin || process.env.CORREIOS_CEP_ORIGEM || '')
            .replace(/\D/g, '')
        const destCep = String(cepDestino).replace(/\D/g, '')

        if (destCep.length !== 8) {
            return NextResponse.json({ error: 'CEP de destino inválido' }, { status: 400 })
        }

        const melhorenvioToken = process.env.MELHORENVIO_TOKEN
        if (!melhorenvioToken || originCep.length !== 8) {
            if (!melhorenvioToken) console.warn('[SHIPPING] MELHORENVIO_TOKEN ausente — usando tabela fixa.')
            else console.warn('[SHIPPING] CEP de origem inválido — usando tabela fixa.')
            return NextResponse.json({ options: FALLBACK_OPTIONS })
        }

        const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${melhorenvioToken}`,
                'User-Agent': 'Cola Comigo (contato@colacomigoshop.com.br)',
            },
            body: JSON.stringify({
                from: { postal_code: originCep },
                to: { postal_code: destCep },
                products: items.map((it: any, index: number) => ({
                    id: String(it.id ?? it.variant_id ?? index),
                    width: 15,
                    height: 15,
                    length: 15,
                    weight: Number(it.weightKg ?? it.weight ?? 0.3),
                    insurance_value: Number(it.price ?? 0),
                    quantity: Math.max(1, Number(it.quantity) || 1),
                })),
            }),
        })

        if (!response.ok) {
            console.error('[MELHORENVIO ERROR]', response.status, (await response.text()).slice(0, 300))
            // Não deixa o cliente sem opção de entrega por falha de terceiro
            return NextResponse.json({ options: FALLBACK_OPTIONS })
        }

        const data = await response.json()
        const options: ShippingOptionOut[] = (Array.isArray(data) ? data : [])
            .filter((s: any) => !s.error && s.price)
            .map((s: any) => {
                const fullName = `${s.company?.name ?? ''} ${s.name ?? ''}`.trim()
                const carrier = detectCarrier(fullName)
                if (!carrier) return null
                return {
                    serviceName: fullName,
                    carrier,
                    price: Number(parseFloat(s.price).toFixed(2)),
                    estimatedDays: Number(s.delivery_time) || 0,
                }
            })
            .filter((o: ShippingOptionOut | null): o is ShippingOptionOut => o !== null)

        // Se sobrou mais de uma cotação do mesmo serviço, fica a mais barata
        const cheapestByCarrier = new Map<string, ShippingOptionOut>()
        for (const option of options) {
            const current = cheapestByCarrier.get(option.carrier)
            if (!current || option.price < current.price) cheapestByCarrier.set(option.carrier, option)
        }

        const finalOptions = Array.from(cheapestByCarrier.values())
        return NextResponse.json({ options: finalOptions.length > 0 ? finalOptions : FALLBACK_OPTIONS })
    } catch (err: any) {
        console.error('[API CHECKOUT SHIPPING ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
