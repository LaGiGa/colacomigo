export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { trackingCode } = await req.json()

    if (!trackingCode) {
        return NextResponse.json({ error: 'Código de rastreio obrigatório' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Obter dados do pedido e endereço
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            address:addresses(*)
        `)
        .eq('id', id)
        .single()

    if (orderError || !order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Assumindo que temos o e-mail no perfil ou no endereço (por enquanto usamos o endereço se houver)
    // Se não houver e-mail no endereço, precisamos buscar no auth ou profile.
    // Como a tabela addresses não tem email, vamos assumir que o usuário está logado e buscar pelo user_id.

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name') // E-mail vem do auth.users, mas aqui facilitaremos
        .eq('id', order.user_id)
        .single()

    // Buscando email do auth.users via Admin SDK (Supabase Service Client)
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id)
    const customerEmail = authUser.user?.email

    if (!customerEmail) {
        return NextResponse.json({ error: 'E-mail do cliente não encontrado' }, { status: 400 })
    }

    const customerName = order.address?.name || profile?.full_name || 'Cliente'

    // Template HTML Brutalista
    const emailHtml = `
    <div style="background-color: #000; color: #fff; font-family: sans-serif; padding: 40px; border: 1px solid #333;">
        <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase;">Cola Comigo Shop</h1>
        <hr style="border: 0; border-top: 2px solid #1a8fff; margin: 20px 0;">
        <p style="font-size: 16px; font-weight: 700; text-transform: uppercase; tracking: 0.1em;">Olá ${customerName},</p>
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase;">Seu pedido está a caminho! 🚀</h2>
        <p style="color: #888;">Seu drop já foi postado e agora você pode acompanhar a entrega.</p>
        
        <div style="background-color: #111; padding: 20px; border-left: 4px solid #1a8fff; margin: 30px 0;">
            <p style="font-size: 10px; font-weight: 900; color: #1a8fff; margin: 0 0 10px 0; text-transform: uppercase;">Código de Rastreio:</p>
            <p style="font-size: 20px; font-weight: 900; margin: 0; letter-spacing: 2px;">${trackingCode.toUpperCase()}</p>
        </div>
        
        <p style="font-size: 12px; color: #666;">Você pode rastrear este código diretamente no site dos Correios ou da transportadora informada.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222;">
            <p style="font-size: 10px; color: #444; text-transform: uppercase; font-weight: 900;">Cola Comigo / Streetwear & Culture</p>
        </div>
    </div>
    `

    const { success, error } = await sendEmail({
        to: customerEmail,
        subject: `Pedido enviado! Rastreio: ${trackingCode.toUpperCase()}`,
        html: emailHtml
    })

    if (!success) {
        return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
