export const dynamic = 'force-dynamic';
// export const runtime = "edge";

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveProvider, sendWhatsAppText, normalizePhone } from '@/lib/whatsapp'
import { resolveStoreWhatsAppNumber } from '@/lib/orders/fulfill'

/** GET — mostra como a notificação está configurada (sem expor credenciais). */
export async function GET() {
    try {
        const supabase = createServiceClient()
        const { number, enabled } = await resolveStoreWhatsAppNumber(supabase)
        const provider = resolveProvider()

        return NextResponse.json({
            provider,
            configured: provider !== 'none',
            enabled,
            number,
        })
    } catch (err: any) {
        console.error('[API WHATSAPP TEST GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** POST — dispara uma mensagem de teste para o número da loja. */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const supabase = createServiceClient()

        const configured = await resolveStoreWhatsAppNumber(supabase)
        const target = normalizePhone(body.number) || configured.number

        if (!target) {
            return NextResponse.json(
                { error: 'Nenhum número de WhatsApp configurado para receber a notificação.' },
                { status: 400 }
            )
        }

        const provider = resolveProvider()
        if (provider === 'none') {
            return NextResponse.json(
                {
                    error: 'Nenhum provedor de WhatsApp configurado. Defina CALLMEBOT_APIKEY (ou as credenciais do provedor escolhido) nas variáveis de ambiente do Cloudflare.',
                },
                { status: 400 }
            )
        }

        const result = await sendWhatsAppText(
            target,
            [
                '✅ *Teste de notificação — Cola Comigo*',
                '',
                'Se você recebeu esta mensagem, as notificações de venda estão funcionando.',
                'A partir de agora, toda compra aprovada chega aqui com os dados do cliente e o tipo de entrega.',
            ].join('\n')
        )

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Falha ao enviar', provider: result.provider },
                { status: 502 }
            )
        }

        return NextResponse.json({ success: true, provider: result.provider, number: target })
    } catch (err: any) {
        console.error('[API WHATSAPP TEST ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
