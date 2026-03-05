import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailData {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY não configurada. E-mail não enviado.')
        return { success: false, error: 'API Key missing' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Cola Comigo <contato@colacomigoshop.com.br>',
            to,
            subject,
            html,
        })

        if (error) {
            console.error('[Resend Error]', error)
            return { success: false, error }
        }

        return { success: true, data }
    } catch (error) {
        console.error('[Email Exception]', error)
        return { success: false, error }
    }
}
