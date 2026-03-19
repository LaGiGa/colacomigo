export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { cepOrigem, cepDestino, items } = await req.json()
        if (!cepDestino || !items || items.length === 0) {
            return NextResponse.json({ error: 'CEP de destino e itens são obrigatórios' }, { status: 400 })
        }

        const originCep = (cepOrigem || process.env.CORREIOS_CEP_ORIGEM || '').replace(/\D/g, '')
        const destCep = cepDestino.replace(/\D/g, '')

        if (originCep.length !== 8 || destCep.length !== 8) {
            return NextResponse.json({ error: 'CEP de origem ou destino inválido' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { data: settings } = await supabase.from('shipping_settings').select('*').eq('id', 1).single()

        if (!settings?.is_active) {
            return NextResponse.json({ options: [] })
        }

        const melhorenvioToken = process.env.MELHORENVIO_TOKEN;
        if (!melhorenvioToken) {
            return NextResponse.json({
                options: [
                    { id: 'correios-pac', name: 'PAC (Correios)', price: 25.90, deadline: 7 },
                    { id: 'correios-sedex', name: 'SEDEX (Correios)', price: 45.90, deadline: 3 }
                ]
            })
        }

        const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${melhorenvioToken}`,
                'User-Agent': 'Cola Comigo (contato@colacomigo.com)'
            },
            body: JSON.stringify({
                from: { postal_code: originCep },
                to: { postal_code: destCep },
                products: items.map((it: any) => ({
                    id: it.id,
                    width: 15,
                    height: 15,
                    length: 15,
                    weight: 0.3,
                    insurance_value: it.price,
                    quantity: it.quantity
                }))
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('[MELHORENVIO ERROR]', errData)
            throw new Error('Falha ao calcular frete')
        }

        const data = await response.json()
        const options = data
            .filter((s: any) => !s.error && s.price)
            .map((s: any) => ({
                id: `${s.company.name.toLowerCase()}-${s.name.toLowerCase()}`,
                name: `${s.company.name} ${s.name}`,
                price: parseFloat(s.price) + (settings.additional_price || 0),
                deadline: s.delivery_time + (settings.additional_days || 0),
                company: s.company.name
            }))

        return NextResponse.json({ options })
    } catch (err: any) {
        console.error('[API CHECKOUT SHIPPING ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
