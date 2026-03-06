import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const ShippingSchema = z.object({
    cepDestino: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos (sem hífen)'),
    itens: z.array(
        z.object({
            quantity: z.number().int().positive(),
            weightKg: z.number().positive().default(0.3),  // peso padrão 300g
            heightCm: z.number().positive().default(2),
            widthCm: z.number().positive().default(15),
            lengthCm: z.number().positive().default(20),
        })
    ).min(1),
})

interface ShippingOption {
    serviceName: string
    carrier: 'correios_pac' | 'correios_sedex'
    price: number
    estimatedDays: number
}

/** Calcula frete usando a API dos Correios CWS */
async function calcularFrete(
    cepDestino: string,
    totalWeightKg: number
): Promise<ShippingOption[]> {
    const cepOrigem = process.env.CORREIOS_CEP_ORIGEM ?? '77006002' // Padrão: Palmas-TO

    // Autenticação Correios CWS
    const authResponse = await fetch(
        'https://api.correios.com.br/token/v1/autentica/cartaopostagem',
        {
            method: 'POST',
            headers: {
                Authorization:
                    'Basic ' +
                    Buffer.from(
                        `${process.env.CORREIOS_USER}:${process.env.CORREIOS_PASSWORD}`
                    ).toString('base64'),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numero: process.env.CORREIOS_NUMERO_CARTAO_POSTAGEM,
            }),
        }
    )

    if (!authResponse.ok) {
        throw new Error('Falha na autenticação com os Correios')
    }

    const { token } = await authResponse.json()

    // Preços dos Correios (PAC = 03298, SEDEX = 03220)
    const servicos = ['03298', '03220']
    const pesoGramas = Math.ceil(totalWeightKg * 1000)

    const precoResponse = await fetch(
        `https://api.correios.com.br/preco/v1/nacional/${servicos.join(',')}` +
        `?cepOrigem=${cepOrigem}` +
        `&cepDestino=${cepDestino}` +
        `&psObjeto=${pesoGramas}` +
        `&tpObjeto=2` +        // 2 = caixa/embalagem
        `&comprimento=20` +
        `&largura=15` +
        `&altura=5`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    if (!precoResponse.ok) {
        throw new Error('Falha ao calcular frete')
    }

    const data = await precoResponse.json()

    const options: ShippingOption[] = []

    if (Array.isArray(data)) {
        for (const servico of data) {
            const isPac = servico.coProduto === '03298'
            const preco = parseFloat(servico.pcFinal?.replace(',', '.') ?? '0')
            const prazo = parseInt(servico.prazoEntrega ?? '7', 10)

            if (preco > 0) {
                options.push({
                    serviceName: isPac ? 'PAC' : 'SEDEX',
                    carrier: isPac ? 'correios_pac' : 'correios_sedex',
                    price: preco,
                    estimatedDays: prazo,
                })
            }
        }
    }

    return options
}

/** Calcula frete usando a API do Melhor Envio */
async function calcularMelhorEnvio(
    cepDestino: string,
    itens: z.infer<typeof ShippingSchema>['itens']
): Promise<ShippingOption[]> {
    const token = process.env.MELHORENVIO_TOKEN
    if (!token) return []

    try {
        const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'ColaComigo/1.0'
            },
            body: JSON.stringify({
                from: { postal_code: process.env.CORREIOS_CEP_ORIGEM ?? '77006002' },
                to: { postal_code: cepDestino },
                products: itens.map((it, i) => ({
                    id: String(i),
                    width: it.widthCm,
                    height: it.heightCm,
                    length: it.lengthCm,
                    weight: it.weightKg,
                    insurance_value: 100,
                    quantity: it.quantity
                }))
            })
        })

        if (!response.ok) return []

        const data = await response.json()
        const options: ShippingOption[] = []

        if (Array.isArray(data)) {
            for (const service of data) {
                if (service.error) continue

                // Filtramos apenas alguns serviços comuns se necessário, ou pegamos todos
                // Aqui pegamos apenas os que tem preço e prazo
                const preco = parseFloat(service.price)
                const prazo = parseInt(service.delivery_time)

                if (preco > 0) {
                    options.push({
                        serviceName: `${service.company.name} ${service.name}`,
                        carrier: `melhor_envio_${service.id}` as any,
                        price: preco,
                        estimatedDays: prazo
                    })
                }
            }
        }

        return options
    } catch (err) {
        console.error('[Melhor Envio] Erro:', err)
        return []
    }
}

export async function POST(request: NextRequest) {
    let body: z.infer<typeof ShippingSchema>

    try {
        body = ShippingSchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json({ error: 'Payload inválido', details: err }, { status: 400 })
    }

    // Soma o peso total dos itens
    const totalWeightKg = body.itens.reduce(
        (sum, item) => sum + item.weightKg * item.quantity,
        0
    )

    try {
        // Busca Correios e Melhor Envio em paralelo
        const [correiosOptions, melhoraOptions] = await Promise.all([
            calcularFrete(body.cepDestino, totalWeightKg).catch(() => []),
            calcularMelhorEnvio(body.cepDestino, body.itens).catch(() => [])
        ])

        const allOptions = [...correiosOptions, ...melhoraOptions]

        if (allOptions.length === 0) {
            return NextResponse.json(
                { error: 'Frete não disponível para este CEP' },
                { status: 422 }
            )
        }

        return NextResponse.json({ options: allOptions })
    } catch (error) {
        console.error('[shipping] Erro:', error)
        return NextResponse.json(
            { error: 'Erro ao calcular frete. Tente novamente.' },
            { status: 500 }
        )
    }
}
