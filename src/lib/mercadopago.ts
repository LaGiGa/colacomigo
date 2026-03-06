/** Funções nativas para APIs do Mercado Pago substituindo o SDK pesado */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mpCreatePreference(body: any) {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            'x-idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`MercadoPago ERRO Preference: ${res.status} ${errorText}`)
    }
    return res.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mpCreatePayment(body: any) {
    const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            'x-idempotency-key': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`MercadoPago ERRO Payment: ${res.status} ${errorText}`)
    }
    return res.json()
}

export async function mpGetPayment(id: string | number) {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
    })
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`MercadoPago GET Payment ERRO: ${res.status} ${errorText}`)
    }
    return res.json()
}
