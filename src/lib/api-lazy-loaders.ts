/**
 * API LAZY LOADERS
 * Importa dependências pesadas dinamicamente para reduzir tamanho do bundle
 * do worker (Cloudflare 3MB limit)
 */

// ─── Mercado Pago (lazy load) ────────────────────────────────────────────────
let mpModuleCache: any = null

export async function getMercadoPagoFunctions() {
    if (mpModuleCache) return mpModuleCache
    
    try {
        mpModuleCache = await import('@/lib/mercadopago')
        return mpModuleCache
    } catch (error) {
        console.error('[Lazy Load] Failed to load Mercado Pago module:', error)
        throw new Error('Mercado Pago module not available')
    }
}

// ─── Email Service (lazy load) ────────────────────────────────────────────────
let emailModuleCache: any = null

export async function getEmailFunctions() {
    if (emailModuleCache) return emailModuleCache
    
    try {
        emailModuleCache = await import('@/lib/email')
        return emailModuleCache
    } catch (error) {
        console.error('[Lazy Load] Failed to load Email module:', error)
        throw new Error('Email module not available')
    }
}

// ─── Helpers que usam lazy load ──────────────────────────────────────────────

export async function createMercadoPagoPreference(payload: any) {
    const { mpCreatePreference } = await getMercadoPagoFunctions()
    return mpCreatePreference(payload)
}

export async function getMercadoPagoPayment(paymentId: string | number) {
    const { mpGetPayment } = await getMercadoPagoFunctions()
    return mpGetPayment(paymentId)
}

export async function sendEmailWithLazyLoad(options: {
    to: string
    subject: string
    html: string
}) {
    const { sendEmail } = await getEmailFunctions()
    return sendEmail(options)
}

export async function getPurchaseEmailHtmlLazy(
    orderId: string,
    customerName: string,
    itemsHtml: string,
    total: number
) {
    const { getPurchaseEmailHtml } = await getEmailFunctions()
    return getPurchaseEmailHtml(orderId, customerName, itemsHtml, total)
}

export async function getCompanyNewSaleEmailHtmlLazy(options: any) {
    const { getCompanyNewSaleEmailHtml } = await getEmailFunctions()
    return getCompanyNewSaleEmailHtml(options)
}

export async function formatCurrencyStringLazy(value: number) {
    const { formatCurrencyString } = await getEmailFunctions()
    return formatCurrencyString(value)
}
