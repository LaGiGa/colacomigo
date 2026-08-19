/**
 * Notificação de venda no WhatsApp da loja.
 *
 * Escrito com um adaptador por provedor: trocar de serviço é trocar a variável
 * de ambiente WHATSAPP_PROVIDER, sem mexer no resto do código.
 *
 *  · callmebot → grátis, sem cadastro. A loja manda UMA mensagem no WhatsApp
 *                para o bot e recebe a APIKEY de volta. Só consegue enviar para
 *                o número que autorizou — que é exatamente o nosso caso.
 *  · zapi      → pago (~R$ 99/mês). Conecta via QR Code no número atual da loja.
 *  · meta      → WhatsApp Cloud API oficial (exige template aprovado).
 *  · none      → não envia, só registra no log (usado em dev / sem credenciais).
 *
 * Nenhuma dependência: só `fetch`, para rodar no Edge Runtime do Cloudflare.
 */

export type WhatsAppProvider = 'callmebot' | 'zapi' | 'meta' | 'none'

export interface WhatsAppResult {
    success: boolean
    provider: WhatsAppProvider
    error?: string
}

/** Limite conservador — provedores gratuitos cortam mensagens muito longas. */
const MAX_MESSAGE_LENGTH = 1500

/**
 * Resolve o provedor ativo. Se WHATSAPP_PROVIDER não estiver definido,
 * deduz pelo conjunto de credenciais presentes.
 */
export function resolveProvider(): WhatsAppProvider {
    const explicit = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase()
    if (explicit === 'callmebot' || explicit === 'zapi' || explicit === 'meta' || explicit === 'none') {
        return explicit
    }
    if (process.env.CALLMEBOT_APIKEY) return 'callmebot'
    if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) return 'zapi'
    if (process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID) return 'meta'
    return 'none'
}

/**
 * Normaliza o telefone para o formato internacional só com dígitos.
 * Aceita "(63) 99131-2913", "63991312913", "+55 63 99131-2913".
 */
export function normalizePhone(raw: string | null | undefined): string | null {
    if (!raw) return null
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 10) return null
    return digits.startsWith('55') ? digits : `55${digits}`
}

/** Envia um texto livre para um número. Nunca lança — sempre devolve o resultado. */
export async function sendWhatsAppText(to: string, message: string): Promise<WhatsAppResult> {
    const provider = resolveProvider()
    const phone = normalizePhone(to)
    const text = message.length > MAX_MESSAGE_LENGTH
        ? `${message.slice(0, MAX_MESSAGE_LENGTH - 3)}...`
        : message

    if (!phone) {
        return { success: false, provider, error: 'Número de destino inválido' }
    }

    try {
        switch (provider) {
            case 'callmebot': return await sendViaCallMeBot(phone, text)
            case 'zapi':      return await sendViaZApi(phone, text)
            case 'meta':      return await sendViaMeta(phone, text)
            default:
                console.warn('[WHATSAPP] Nenhum provedor configurado. Mensagem não enviada:\n', text)
                return { success: false, provider: 'none', error: 'Provedor não configurado' }
        }
    } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        console.error(`[WHATSAPP ${provider.toUpperCase()} ERROR]`, error)
        return { success: false, provider, error }
    }
}

/**
 * Envia com 1 retentativa. Notificação de venda não pode depender de um
 * soluço de rede, mas também não pode segurar a resposta do webhook.
 */
export async function sendWhatsAppTextWithRetry(to: string, message: string): Promise<WhatsAppResult> {
    const first = await sendWhatsAppText(to, message)
    if (first.success || first.provider === 'none') return first

    console.warn('[WHATSAPP] Primeira tentativa falhou, tentando novamente:', first.error)
    return sendWhatsAppText(to, message)
}

// ─── Adaptadores ─────────────────────────────────────────────────────────────

async function sendViaCallMeBot(phone: string, text: string): Promise<WhatsAppResult> {
    const apiKey = process.env.CALLMEBOT_APIKEY
    if (!apiKey) return { success: false, provider: 'callmebot', error: 'CALLMEBOT_APIKEY não configurada' }

    const params = new URLSearchParams({ phone: `+${phone}`, text, apikey: apiKey })
    const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params.toString()}`, {
        method: 'GET',
        headers: { 'User-Agent': 'ColaComigoShop/1.0' },
    })

    const body = await res.text()

    // A API responde HTML. Erro de apikey/telefone volta com 200 + texto de erro,
    // então precisamos olhar o corpo além do status.
    const failed = !res.ok || /error|invalid|not registered|apikey/i.test(body)
    if (failed) {
        return { success: false, provider: 'callmebot', error: `HTTP ${res.status}: ${body.slice(0, 200)}` }
    }
    return { success: true, provider: 'callmebot' }
}

async function sendViaZApi(phone: string, text: string): Promise<WhatsAppResult> {
    const instance = process.env.ZAPI_INSTANCE_ID
    const token = process.env.ZAPI_TOKEN
    if (!instance || !token) {
        return { success: false, provider: 'zapi', error: 'ZAPI_INSTANCE_ID / ZAPI_TOKEN não configurados' }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.ZAPI_CLIENT_TOKEN) headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN

    const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone, message: text }),
    })

    if (!res.ok) {
        return { success: false, provider: 'zapi', error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` }
    }
    return { success: true, provider: 'zapi' }
}

async function sendViaMeta(phone: string, text: string): Promise<WhatsAppResult> {
    const token = process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.META_WHATSAPP_PHONE_ID
    if (!token || !phoneId) {
        return { success: false, provider: 'meta', error: 'META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_ID não configurados' }
    }

    const template = process.env.META_WHATSAPP_TEMPLATE
    // Mensagem iniciada pela empresa exige template aprovado. Se houver um
    // configurado usamos ele; senão tentamos texto livre (só funciona dentro
    // da janela de 24h de atendimento).
    const payload = template
        ? {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: template,
                language: { code: process.env.META_WHATSAPP_TEMPLATE_LANG || 'pt_BR' },
                components: [{ type: 'body', parameters: [{ type: 'text', text }] }],
            },
        }
        : { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: text } }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        return { success: false, provider: 'meta', error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` }
    }
    return { success: true, provider: 'meta' }
}

// ─── Mensagem de nova venda ──────────────────────────────────────────────────

export interface SaleNotificationItem {
    name: string
    quantity: number
    totalPrice: number
    size?: string | null
    colorName?: string | null
}

export interface SaleNotificationAddress {
    street?: string | null
    number?: string | null
    complement?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    zip_code?: string | null
}

export interface SaleNotificationInput {
    orderId: string
    total: number
    subtotal?: number | null
    shippingCost?: number | null
    discount?: number | null
    couponCode?: string | null
    paymentMethod?: string | null
    shippingMethod?: string | null
    shippingLabel?: string | null
    customerName?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    address?: SaleNotificationAddress | null
    items: SaleNotificationItem[]
}

const PAYMENT_LABELS: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bolbradesco: 'Boleto',
    boleto: 'Boleto',
    account_money: 'Saldo Mercado Pago',
}

const SHIPPING_LABELS: Record<string, string> = {
    store_pickup: '🏪 RETIRADA NA LOJA',
    local_delivery: '🛵 ENTREGA LOCAL',
    palmas_local: '🛵 ENTREGA LOCAL',
    correios: '📮 CORREIOS',
    correios_pac: '📮 CORREIOS (PAC)',
    correios_sedex: '📮 CORREIOS (SEDEX)',
    pac: '📮 CORREIOS (PAC)',
    sedex: '📮 CORREIOS (SEDEX)',
}

function brl(value: number | null | undefined) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatPhone(raw: string | null | undefined) {
    const digits = (raw || '').replace(/\D/g, '').replace(/^55/, '')
    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return raw || 'Não informado'
}

/**
 * Monta a mensagem que a loja recebe no WhatsApp.
 * Texto puro com marcação do WhatsApp (*negrito*) — sem HTML.
 */
export function buildSaleNotificationMessage(input: SaleNotificationInput): string {
    const shortId = input.orderId.slice(0, 8).toUpperCase()
    const isPickup = input.shippingMethod === 'store_pickup'
    const needsAddress = !isPickup && !!input.address?.street

    const payment = input.paymentMethod
        ? PAYMENT_LABELS[input.paymentMethod] || input.paymentMethod
        : 'Não informado'

    const shippingTitle = input.shippingMethod
        ? SHIPPING_LABELS[input.shippingMethod] || `📦 ${input.shippingLabel || input.shippingMethod}`
        : `📦 ${input.shippingLabel || 'Não informado'}`

    const lines: string[] = []

    lines.push(`🔥 *NOVA VENDA CONFIRMADA*`)
    lines.push(`Pedido *#${shortId}*`)
    lines.push('')
    lines.push(`💰 Total: *${brl(input.total)}*  (${payment})`)

    if (input.discount && input.discount > 0) {
        lines.push(`🏷️ Desconto: -${brl(input.discount)}${input.couponCode ? ` (${input.couponCode})` : ''}`)
    }

    lines.push('')
    lines.push('👤 *CLIENTE*')
    lines.push(input.customerName || 'Não informado')
    lines.push(`📱 ${formatPhone(input.customerPhone)}`)
    if (input.customerEmail) lines.push(`✉️ ${input.customerEmail}`)

    lines.push('')
    lines.push(`*ENTREGA:* ${shippingTitle}`)
    if (input.shippingLabel && !isPickup) {
        lines.push(`${input.shippingLabel} — ${brl(input.shippingCost)}`)
    }

    if (isPickup) {
        lines.push('O cliente vai retirar na loja. Combinar horário.')
    } else if (needsAddress) {
        const a = input.address!
        lines.push(`${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ''}`)
        if (a.neighborhood) lines.push(a.neighborhood)
        lines.push(`${a.city || ''}${a.state ? `/${a.state}` : ''}${a.zip_code ? ` — CEP ${a.zip_code}` : ''}`)
    } else {
        lines.push('⚠️ Endereço não informado no pedido.')
    }

    lines.push('')
    lines.push('🛒 *ITENS*')
    for (const item of input.items) {
        const variant = [item.size ? `Tam ${item.size}` : null, item.colorName]
            .filter(Boolean)
            .join(' · ')
        lines.push(`• ${item.name}${variant ? ` (${variant})` : ''} — ${item.quantity}un — ${brl(item.totalPrice)}`)
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.colacomigoshop.com.br').replace(/\/$/, '')
    lines.push('')
    lines.push('📉 Estoque já atualizado automaticamente.')
    lines.push(`🔗 ${baseUrl}/admin/pedidos/${input.orderId}`)

    return lines.join('\n')
}
