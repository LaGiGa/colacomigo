export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { mpCreatePreference, mpCreatePayment, mpGetPayment } from '@/lib/mercadopago'
import { sendEmail, getPurchaseEmailHtml, formatCurrencyString } from '@/lib/email'
import { formatCurrency } from '@/lib/utils'
import { z } from 'zod'

/**
 * RECURSO CENTRALIZADO PARA REDUÇÃO DE BUNDLE (CLOUDFLARE 3MB LIMIT)
 * Este arquivo unifica todas as rotas da API Checkout e Webhooks para compartilhar o mesmo Worker/Boilerplate.
 */

const ShippingSchema = z.object({
    cepDestino: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos (sem hífen)'),
    itens: z.array(z.object({
        quantity: z.number().int().positive(),
        weightKg: z.number().positive().default(0.3),
        heightCm: z.number().positive().default(2),
        widthCm: z.number().positive().default(15),
        lengthCm: z.number().positive().default(20),
    })).min(1),
})

const CreatePreferenceSchema = z.object({
    items: z.array(z.any()),
    customerInfo: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        zipCode: z.string(),
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
    }).optional(),
    addressId: z.string().uuid().optional(),
    paymentMethod: z.string().optional(),
    coupon: z.string().optional(),
    shippingCost: z.number().default(0),
    shippingMethod: z.string().optional(),
    discount: z.number().default(0),
    profileId: z.string().uuid().optional(),
})

const ProcessPaymentSchema = z.object({
    preferenceId: z.string(),
    selectedPaymentMethod: z.string(),
    formData: z.record(z.string(), z.unknown()),
})

// --- HELPERS ---
async function validateMpSignature(request: NextRequest): Promise<boolean> {
    const xSignature = request.headers.get('x-signature'), xRequestId = request.headers.get('x-request-id'), secret = process.env.MP_WEBHOOK_SECRET
    if (!xSignature || !xRequestId || !secret) return false
    const params: any = {}; xSignature.split(',').forEach(p => { const [k, v] = p.trim().split('='); if (k && v) params[k] = v })
    const url = new URL(request.url), dataId = url.searchParams.get('data.id') ?? '', manifest = `id:${dataId};request-id:${xRequestId};ts:${params.ts};`
    const encoder = new TextEncoder(), key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('') === params.v1
}

// --- MAIN DISPATCHER ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const { slug = [] } = await params; const action = slug[0]; const supabase = createServiceClient()

        // 1. CÁLCULO DE FRETE (Melhor Envio)
        if (action === 'shipping') {
            const body = ShippingSchema.parse(await req.json());
            const totalWeight = body.itens.reduce((s, i) => s + (i.weightKg * i.quantity), 0)

            const melhoreNVioToken = process.env.MELHORENVIO_TOKEN;
            if (!melhoreNVioToken) throw new Error('Melhor Envio Token não configurado');

            // CEP de Origem (Palmas-TO como fallback se não houver no ENV)
            const fromCep = process.env.CORREIOS_CEP_ORIGEM ?? '77006002';

            const payload = {
                from: { postal_code: fromCep },
                to: { postal_code: body.cepDestino },
                products: body.itens.map((item, idx) => ({
                    id: String(idx),
                    width: item.widthCm,
                    height: item.heightCm,
                    length: item.lengthCm,
                    weight: item.weightKg,
                    insurance_value: 0,
                    quantity: item.quantity
                }))
            };

            const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${melhoreNVioToken}`,
                    'User-Agent': 'ColaComigo/1.0'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error('[Melhor Envio Error]', errData);
                throw new Error('Falha ao calcular frete no Melhor Envio.');
            }

            const data = await response.json();

            // Mapear apenas serviços úteis (Correios PAC e SEDEX)
            // IDs do Melhor Envio: 1 = Correios PAC, 2 = Correios SEDEX
            const options = (Array.isArray(data) ? data : [])
                .filter(s => !s.error && (s.id === 1 || s.id === 2))
                .map(s => ({
                    serviceName: s.name,                 // 'PAC' ou 'SEDEX'
                    carrier: s.id === 1 ? 'correios_pac' : 'correios_sedex',
                    price: parseFloat(s.price),
                    estimatedDays: s.delivery_time + (s.additional_days || 0)
                }));

            return NextResponse.json({ options });
        }

        // 2. VALIDAÇÃO DE CUPOM
        if (action === 'coupon-validate') {
            const { code } = await req.json()
            const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
            if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) < new Date()) || (coupon.max_uses && coupon.uses_count >= coupon.max_uses)) return NextResponse.json({ error: 'Inválido' }, { status: 404 })
            return NextResponse.json({ code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value, min_order_value: coupon.min_order_value })
        }

        // 3. CRIAÇÃO DE PREFERÊNCIA E PEDIDO
        if (action === 'create-preference') {
            const body = CreatePreferenceSchema.parse(await req.json());
            const authClient = await createClient()
            const { data: { user } } = await authClient.auth.getUser()

            let address_id = body.addressId;

            // Se tiver customerInfo, cria ou atualiza o endereço
            if (body.customerInfo) {
                const { data: addr, error: addrError } = await supabase.from('addresses').upsert({
                    user_id: user?.id || body.profileId,
                    name: body.customerInfo.name,
                    email: body.customerInfo.email,
                    phone: body.customerInfo.phone,
                    street: body.customerInfo.street,
                    number: body.customerInfo.number,
                    complement: body.customerInfo.complement,
                    neighborhood: body.customerInfo.neighborhood,
                    city: body.customerInfo.city,
                    state: body.customerInfo.state,
                    zip_code: body.customerInfo.zipCode,
                }, { onConflict: 'user_id, street, number' }).select('id').single();

                if (addrError) {
                    // Fallback se o upsert falhar por falta de constraint
                    const { data: addr2 } = await supabase.from('addresses').insert({
                        user_id: user?.id || body.profileId,
                        name: body.customerInfo.name,
                        email: body.customerInfo.email,
                        phone: body.customerInfo.phone,
                        street: body.customerInfo.street,
                        number: body.customerInfo.number,
                        complement: body.customerInfo.complement,
                        neighborhood: body.customerInfo.neighborhood,
                        city: body.customerInfo.city,
                        state: body.customerInfo.state,
                        zip_code: body.customerInfo.zipCode,
                    }).select('id').single();
                    address_id = addr2?.id;
                } else {
                    address_id = addr.id;
                }
            }

            // Garante URL absoluta para o Mercado Pago (Crucial para o auto_return funcionar)
            let rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            // Se por algum motivo a variável vier como a string "undefined" ou estiver vazia
            if (!rawUrl || rawUrl === 'undefined' || rawUrl === '') {
                rawUrl = 'http://localhost:3000';
            }

            let baseUrl = rawUrl.trim();
            // Remove barra final se existir para evitar // nas URLs
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            // Garante que comece com http
            if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;

            const preferenceItems: any[] = body.items.map((i: any) => ({
                title: String(i.productName).slice(0, 100),
                quantity: Math.max(1, Number(i.quantity) || 1),
                unit_price: Number(Number(i.unitPrice || 0).toFixed(2)),
                currency_id: 'BRL',
                picture_url: i.imageUrl || undefined
            }));

            // Adiciona frete como item se houver custo
            if (body.shippingCost > 0) {
                preferenceItems.push({
                    title: 'FRETE / ENTREGA',
                    quantity: 1,
                    unit_price: Number(Number(body.shippingCost).toFixed(2)),
                    currency_id: 'BRL'
                });
            }

            // Adiciona desconto como item negativo se houver
            if (body.discount > 0) {
                preferenceItems.push({
                    title: 'DESCONTO APLICADO',
                    quantity: 1,
                    unit_price: -Number(Number(body.discount).toFixed(2)),
                    currency_id: 'BRL'
                });
            }

            const preferencePayload: any = {
                items: preferenceItems,
                back_urls: {
                    success: `${baseUrl}/checkout/sucesso`,
                    failure: `${baseUrl}/checkout`,
                    pending: `${baseUrl}/checkout/pendente`
                },
                statement_descriptor: 'COLACOMIGO',
                expires: false,
                external_reference: body.profileId || user?.id || 'guest'
            };

            // Mercado Pago exige que auto_return só seja usado se back_urls estiverem ok e não forem localhost em alguns casos
            if (!baseUrl.includes('localhost')) {
                preferencePayload.auto_return = 'approved';
            }

            // Cria Preferência no Mercado Pago
            const preference = await mpCreatePreference(preferencePayload);

            const subtotal = body.items.reduce((n: any, i: any) => n + (i.unitPrice * i.quantity), 0);
            const total = subtotal + body.shippingCost - body.discount;

            // Cria o pedido no Supabase
            const { data: order, error: orderError } = await supabase.from('orders').insert({
                user_id: user?.id || body.profileId,
                address_id: address_id,
                subtotal: subtotal,
                total: total,
                shipping_cost: body.shippingCost,
                discount: body.discount,
                status: 'awaiting_payment',
                mp_preference_id: preference.id,
                customer_email: body.customerInfo?.email || user?.email,
                customer_name: body.customerInfo?.name || user?.user_metadata?.display_name,
                customer_phone: body.customerInfo?.phone,
                notes: `Frete: ${body.shippingMethod || 'Não informado'}`
            }).select().single()

            if (orderError) throw orderError;

            // Insere os itens do pedido
            const orderItems = body.items.map(i => ({
                order_id: order.id,
                variant_id: i.variantId,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                total_price: i.unitPrice * i.quantity
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) console.error('Error inserting order items:', itemsError);

            return NextResponse.json({ preferenceId: preference.id, orderId: order.id, initPoint: preference.init_point })
        }

        // 4. PROCESSAMENTO DE PAGAMENTO (Checkout Transparente)
        if (action === 'process-payment') {
            const body = ProcessPaymentSchema.parse(await req.json());
            const { data: order } = await supabase.from('orders').select('*').eq('mp_preference_id', body.preferenceId).single()
            if (!order) throw new Error('Pedido não encontrado para esta preferência')

            let baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`; // Força https em produção

            const paymentPayload: any = {
                ...body.formData,
                transaction_amount: order.total,
                metadata: { order_id: order.id }
            };

            const selectedMethod = (body.selectedPaymentMethod || '').toLowerCase();

            // Fallback para PIX quando o Brick não envia payment_method_id explicitamente.
            if (!paymentPayload.payment_method_id && (selectedMethod === 'banktransfer' || selectedMethod === 'pix')) {
                paymentPayload.payment_method_id = 'pix';
            }

            // O MP exige e-mail do pagador para vários meios (incluindo PIX).
            if (!paymentPayload.payer) paymentPayload.payer = {};
            if (!paymentPayload.payer.email && order.customer_email) {
                paymentPayload.payer.email = order.customer_email;
            }

            // Mercado Pago NÃO aceita localhost ou IPs locais na notification_url
            if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
                paymentPayload.notification_url = `${baseUrl}/api/checkout/webhook`;
            }

            let payment: any
            try {
                payment = await mpCreatePayment(paymentPayload);
            } catch (e: any) {
                const msg = String(e?.message || '')
                if (msg.includes('without key enabled for QR')) {
                    return NextResponse.json(
                        {
                            error: 'PIX indisponível na conta Mercado Pago: habilite uma chave PIX da conta do recebedor no painel do Mercado Pago e tente novamente.'
                        },
                        { status: 400 }
                    )
                }
                throw e
            }
            const status = payment.status === 'approved' ? 'paid' : (payment.status === 'rejected' ? 'cancelled' : 'awaiting_payment');

            // Atualiza o pedido com status e ID do pagamento do MP
            await supabase.from('orders').update({
                status,
                mp_payment_id: String(payment.id),
                // Garante que o nome e telefone estejam salvos caso não tenham sido salvos na preferência
                customer_name: order.customer_name || payment.payer?.first_name ? `${payment.payer.first_name || ''} ${payment.payer.last_name || ''}`.trim() : order.customer_name,
                customer_phone: order.customer_phone || (payment.payer?.phone?.area_code ? `${payment.payer.phone.area_code}${payment.payer.phone.number}` : order.customer_phone)
            }).eq('id', order.id);

            await supabase.from('payment_transactions').insert({
                order_id: order.id,
                mp_payment_id: String(payment.id),
                amount: payment.transaction_amount,
                method: body.selectedPaymentMethod,
                status: payment.status,
                raw_data: payment
            });

            // Se aprovado, baixa estoque e envia email (mesma lógica do Webhook)
            if (status === 'paid') {
                const { data: items } = await supabase.from('order_items').select('quantity, total_price, variant_id, variant:product_variants(size, color_name, product:products(name))').eq('order_id', order.id);

                let itemsHtml = '';
                if (items) {
                    itemsHtml = items.map((it: any) => `
                        <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                            <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                            <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                            <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrencyString(it.total_price)}</p>
                        </div>
                    `).join('');

                    for (const it of items) {
                        try {
                            await supabase.rpc('decrement_stock', { p_variant_id: it.variant_id, p_qty: it.quantity });
                        } catch (e) {
                            console.error('Error decrementing stock:', e);
                        }
                    }
                }

                if (order.customer_email) {
                    const orderIdShort = order.id.slice(0, 8).toUpperCase();
                    await sendEmail({
                        to: order.customer_email,
                        subject: `Pagamento Confirmado! #${orderIdShort}`,
                        html: getPurchaseEmailHtml(order.id, order.customer_name || 'Família', itemsHtml, order.total || 0)
                    });
                }
            }

            return NextResponse.json({ paymentId: payment.id, status: payment.status, orderStatus: status })
        }

        // 5. WEBHOOK MERCADO PAGO
        if (action === 'webhook') {
            if (!(await validateMpSignature(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const body = await req.json(); if (body.type !== 'payment' || !body.data?.id) return NextResponse.json({ received: true })
            const payment = await mpGetPayment(body.data.id); const orderId = (payment.metadata as any)?.order_id; if (!orderId) return NextResponse.json({ received: true })
            const status = payment.status === 'approved' ? 'paid' : (payment.status === 'rejected' ? 'cancelled' : 'awaiting_payment')
            await supabase.from('orders').update({ status, mp_payment_id: String(body.data.id) }).eq('id', orderId)
            await supabase.from('payment_transactions').insert({ order_id: orderId, mp_payment_id: String(body.data.id), amount: payment.transaction_amount, method: payment.payment_type_id, status: payment.status, raw_data: payment })
            if (status === 'paid') {
                const { data: items } = await supabase.from('order_items').select('quantity, total_price, variant_id, variant:product_variants(size, color_name, product:products(name))').eq('order_id', orderId)

                let itemsHtml = '';
                if (items) {
                    itemsHtml = items.map((it: any) => `
                        <div style="padding: 10px 0; border-bottom: 1px solid #222;">
                            <p style="margin: 0; font-weight: 900;">${it.variant?.product?.name} x ${it.quantity}</p>
                            <p style="margin: 0; font-size: 12px; color: #888;">${it.variant?.size ? `Tamanho: ${it.variant.size}` : ''} ${it.variant?.color_name ? ` · Cor: ${it.variant.color_name}` : ''}</p>
                            <p style="margin: 5px 0 0 0; color: #1a8fff; font-weight: 700;">${formatCurrencyString(it.total_price)}</p>
                        </div>
                    `).join('');

                    for (const it of items) await supabase.rpc('decrement_stock', { p_variant_id: it.variant_id, p_qty: it.quantity })
                }
                const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single()

                if (orderData.customer_email) {
                    await sendEmail({
                        to: orderData.customer_email,
                        subject: `Pagamento Confirmado! #${orderId.slice(0, 8).toUpperCase()}`,
                        html: getPurchaseEmailHtml(orderId, orderData.customer_name || 'Família', itemsHtml, orderData.total || 0)
                    })
                }
            }
            return NextResponse.json({ received: true })
        }

        return NextResponse.json({ error: 'N/A' }, { status: 404 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() { return NextResponse.json({ status: 'ok' }) }
