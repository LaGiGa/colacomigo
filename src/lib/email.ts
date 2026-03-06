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
