/**
 * Módulo de e-mail otimizado para Edge Runtime.
 * Substitui o SDK pesado 'resend' por chamadas diretas via fetch para reduzir bundle.
 */

interface SendEmailData {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailData) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('[Email] RESEND_API_KEY não configurada. E-mail não enviado.');
        return { success: false, error: 'API Key missing' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Cola Comigo <contato@colacomigoshop.com.br>',
                to,
                subject,
                html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Resend API Error]', data);
            return { success: false, error: data };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Email API Exception]', error);
        return { success: false, error };
    }
}

export function formatCurrencyString(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function getPurchaseEmailHtml(orderId: string, customerName: string, itemsHtml: string, total: number) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000'
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : 'https://colacomigoshop.com.br';
    return `
    <div style="background-color: #000; color: #fff; font-family: sans-serif; padding: 0; border: 1px solid #333; max-width: 600px; margin: 0 auto;">
        <!-- Header Logo -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; border-bottom: 2px solid #1a8fff;">
            <tr>
                <td align="center" style="padding: 30px 20px;">
                    <img src="${baseUrl}/logo.png" alt="Cola Comigo Shop" width="180" style="display: block; width: 180px; max-width: 100%; border: 0; margin: 0 auto;">
                </td>
            </tr>
        </table>

        <div style="padding: 40px;">
            <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-top: 0;">Pagamento Confirmado! ✅</h2>
            <p style="color: #888;">Fala família, ${customerName}! O seu pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> já foi confirmado e está sendo preparado para o drop.</p>
            
            <div style="margin: 30px 0;">
                <h3 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Resumo do Drop</h3>
                ${itemsHtml}
            </div>

            <div style="background-color: #111; padding: 20px; text-align: right; border-left: 4px solid #1a8fff;">
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Total Pago:</p>
                <p style="margin: 0; font-size: 24px; font-weight: 900; color: #1a8fff;">${formatCurrencyString(total)}</p>
            </div>
            
            <p style="font-size: 14px; color: #fff; margin-top: 30px; font-weight: 700;">Dicas de quem manja (Cuidados):</p>
            <div style="width: 100%; margin-top: 10px; border: 1px solid #222; border-radius: 8px; padding: 15px; background-color: #050505;">
                <ul style="color: #aaa; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 15px;">
                    <li style="margin-bottom: 6px;">Lave as peças pelo avesso para manter a cor e estampa vivas.</li>
                    <li style="margin-bottom: 6px;">Evite secadora; seque à sombra e ao ar livre.</li>
                    <li style="margin-bottom: 6px;">Passe o ferro apenas do lado do avesso (longe das estampas).</li>
                    <li>Use sabão neutro e fuja do cloro.</li>
                </ul>
            </div>

            <footer style="margin-top: 40px; border-top: 1px solid #222; pt: 20px; text-align: center;">
                <p style="font-size: 12px; color: #666;">Qualquer dúvida, brota no WhatsApp: (63) 99131-2913</p>
                <p style="font-size: 10px; color: #444; margin-top: 10px;">© ${new Date().getFullYear()} Cola Comigo Shop. Todos os direitos reservados.</p>
            </footer>
        </div>
    </div>
    `
}

export function getShippingEmailHtml(orderId: string, customerName: string, trackingCode: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000'
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : 'https://colacomigoshop.com.br';
    return `
    <div style="background-color: #000; color: #fff; font-family: sans-serif; padding: 0; border: 1px solid #333; max-width: 600px; margin: 0 auto;">
        <!-- Header Logo -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; border-bottom: 2px solid #1a8fff;">
            <tr>
                <td align="center" style="padding: 30px 20px;">
                    <img src="${baseUrl}/logo.png" alt="Cola Comigo Shop" width="180" style="display: block; width: 180px; max-width: 100%; border: 0; margin: 0 auto;">
                </td>
            </tr>
        </table>

        <div style="padding: 40px;">
            <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-top: 0;">A caminho! 🚀</h2>
            <p style="color: #888;">Fala família, ${customerName}! Ótima notícia: seu pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> já está com a transportadora.</p>
            
            <p style="color: #888; margin-top: 20px;">Você pode acompanhar a entrega usando este código de rastreio:</p>
            <div style="background: #111; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #333;">
                <strong style="font-size: 20px; font-family: monospace; letter-spacing: 2px; color: #1a8fff;">${trackingCode}</strong>
            </div>
            <p style="color: #888;">Acompanhe pelo site dos Correios. Se tiver qualquer dúvida, é só chamar.</p>

            <footer style="margin-top: 40px; border-top: 1px solid #222; pt: 20px; text-align: center;">
                <p style="font-size: 12px; color: #666;">Qualquer dúvida, brota no WhatsApp: (63) 99131-2913</p>
                <p style="font-size: 10px; color: #444; margin-top: 10px;">© ${new Date().getFullYear()} Cola Comigo Shop. Todos os direitos reservados.</p>
            </footer>
        </div>
    </div>
    `
}

interface SaleItem {
    name: string
    quantity: number
    totalPrice: number
    size?: string | null
    colorName?: string | null
}

interface CompanySaleEmailInput {
    orderId: string
    customerName: string
    customerEmail?: string | null
    customerPhone?: string | null
    total: number
    paymentMethod?: string | null
    shippingMethod?: string | null
    items: SaleItem[]
}

export function getCompanyNewSaleEmailHtml(input: CompanySaleEmailInput) {
    const paymentMethod = input.paymentMethod || 'Não informado'
    const shippingMethod = input.shippingMethod || 'Não informado'
    const itemsHtml = input.items.map((item) => {
        const variant = [item.size ? `Tam: ${item.size}` : null, item.colorName ? `Cor: ${item.colorName}` : null]
            .filter(Boolean)
            .join(' · ')

        return `
        <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrencyString(item.totalPrice)}</td>
        </tr>
        ${variant ? `<tr><td colspan="3" style="padding: 0 8px 10px; color: #6b7280; font-size: 12px;">${variant}</td></tr>` : ''}
        `
    }).join('')

    return `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 680px; margin: 0 auto; border: 1px solid #e5e7eb;">
        <div style="background: #111827; color: #fff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">Nova venda confirmada</h2>
            <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">Pedido #${input.orderId.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="padding: 20px;">
            <p style="margin: 0 0 10px;"><strong>Cliente:</strong> ${input.customerName}</p>
            <p style="margin: 0 0 10px;"><strong>E-mail:</strong> ${input.customerEmail || 'Não informado'}</p>
            <p style="margin: 0 0 10px;"><strong>Telefone:</strong> ${input.customerPhone || 'Não informado'}</p>
            <p style="margin: 0 0 10px;"><strong>Pagamento:</strong> ${paymentMethod}</p>
            <p style="margin: 0 0 16px;"><strong>Frete:</strong> ${shippingMethod}</p>

            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px 8px; text-align: left; font-size: 12px;">Item</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 12px;">Qtd</th>
                        <th style="padding: 10px 8px; text-align: right; font-size: 12px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <p style="margin: 18px 0 0; font-size: 18px;"><strong>Total do pedido: ${formatCurrencyString(input.total)}</strong></p>
        </div>
    </div>
    `
}
