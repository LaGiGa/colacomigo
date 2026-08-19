export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createMercadoPagoPreference } from '@/lib/api-lazy-loaders'

/**
 * Cria o pedido no banco e a preferência no Mercado Pago.
 *
 * ⚠️ REGRA DE OURO: nada que envolve dinheiro vem do cliente.
 * Preço unitário, frete e desconto são SEMPRE recalculados aqui a partir do
 * banco. O corpo da requisição só diz *o que* o cliente quer comprar e *como*
 * quer receber — nunca *quanto* custa.
 */

type ShippingMethod = 'store_pickup' | 'local_delivery' | 'correios_pac' | 'correios_sedex' | 'correios'

/** Normaliza o `carrier` vindo do checkout para o valor gravado no pedido. */
function normalizeShippingMethod(carrier?: string | null): ShippingMethod {
    const value = (carrier || '').toLowerCase()
    if (value.includes('pickup') || value.includes('retirada')) return 'store_pickup'
    if (value.includes('palmas') || value.includes('local')) return 'local_delivery'
    if (value.includes('sedex')) return 'correios_sedex'
    if (value.includes('pac')) return 'correios_pac'
    return 'correios'
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { items, customer, shipping, coupon, couponCode } = body

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Itens são obrigatórios' }, { status: 400 })
        }
        if (!customer?.name || !customer?.email) {
            return NextResponse.json({ error: 'Dados do cliente são obrigatórios' }, { status: 400 })
        }

        const supabase = createServiceClient()

        // ─── Cliente logado (opcional, mas necessário para "Meus Pedidos") ───
        let userId: string | null = null
        try {
            const authClient = await createClient()
            const { data } = await authClient.auth.getUser()
            userId = data.user?.id ?? null
        } catch {
            // checkout de convidado segue normalmente
        }

        // ─── 1. Busca preços e estoque REAIS no banco ────────────────────────
        const requested = items
            .map((it: any) => ({
                variantId: String(it.variant_id || it.variantId || ''),
                quantity: Math.max(1, Math.floor(Number(it.quantity) || 0)),
            }))
            .filter((it) => it.variantId)

        if (requested.length === 0) {
            return NextResponse.json({ error: 'Itens inválidos' }, { status: 400 })
        }

        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('id, price_delta, stock, is_active, size, color_name, product:products(id, name, price, is_active)')
            .in('id', requested.map((it) => it.variantId))

        if (variantsError) {
            console.error('[PREFERENCE] Erro ao buscar variantes:', variantsError)
            throw new Error('Não foi possível validar os itens do carrinho')
        }

        const variantMap = new Map((variants ?? []).map((v: any) => [v.id, v]))

        const unavailable: { variantId: string; name: string; requested: number; available: number }[] = []
        const priced: {
            variantId: string
            quantity: number
            unitPrice: number
            name: string
            size: string | null
            colorName: string | null
        }[] = []

        for (const item of requested) {
            const variant: any = variantMap.get(item.variantId)

            // Variante removida do catálogo (ou carrinho antigo no navegador)
            if (!variant || variant.is_active === false || variant.product?.is_active === false) {
                unavailable.push({
                    variantId: item.variantId,
                    name: variant?.product?.name || 'Produto indisponível',
                    requested: item.quantity,
                    available: 0,
                })
                continue
            }

            const stock = Number(variant.stock ?? 0)
            if (stock < item.quantity) {
                unavailable.push({
                    variantId: item.variantId,
                    name: variant.product?.name || 'Produto',
                    requested: item.quantity,
                    available: stock,
                })
                continue
            }

            // Mesmo cálculo da vitrine: preço do produto + delta da variante
            const unitPrice = Number(variant.product?.price ?? 0) + Number(variant.price_delta ?? 0)
            priced.push({
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: Math.max(0, Number(unitPrice.toFixed(2))),
                name: variant.product?.name || 'Produto',
                size: variant.size ?? null,
                colorName: variant.color_name ?? null,
            })
        }

        if (unavailable.length > 0) {
            return NextResponse.json(
                {
                    error: 'Alguns itens não estão mais disponíveis na quantidade pedida.',
                    code: 'OUT_OF_STOCK',
                    unavailable,
                },
                { status: 409 }
            )
        }

        const subtotal = Number(priced.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0).toFixed(2))

        // ─── 2. Frete calculado pelas configurações da loja ──────────────────
        const { data: shippingSettings } = await supabase
            .from('shipping_settings')
            .select('*')
            .eq('id', 1)
            .single()

        const shippingMethod = normalizeShippingMethod(shipping?.carrier)
        const freeShipping =
            !!shippingSettings?.free_shipping_enabled &&
            subtotal >= Number(shippingSettings?.free_shipping_threshold ?? Infinity)

        let shippingPrice: number
        if (shippingMethod === 'store_pickup') {
            shippingPrice = 0
        } else if (shippingMethod === 'local_delivery') {
            shippingPrice = Number(shippingSettings?.local_delivery_price ?? 0)
        } else {
            // Correios: a cotação vem de API externa, então não dá para recalcular
            // aqui sem custo. Aceitamos o valor cotado, mas só para cima de zero —
            // manipular esse campo nunca reduz o total abaixo do frete real.
            shippingPrice = freeShipping ? 0 : Math.max(0, Number(shipping?.price) || 0)
        }
        shippingPrice = Number(shippingPrice.toFixed(2))

        const shippingLabel: string =
            typeof shipping?.name === 'string' && shipping.name.trim()
                ? shipping.name.trim().slice(0, 120)
                : shippingMethod === 'store_pickup'
                    ? shippingSettings?.store_pickup_label || 'Retirar na Loja'
                    : shippingMethod === 'local_delivery'
                        ? shippingSettings?.local_delivery_label || 'Entrega Local'
                        : 'Correios'

        // ─── 3. Cupom validado e calculado no servidor ───────────────────────
        const code = String(couponCode || coupon?.code || '').trim().toUpperCase()
        let discount = 0
        let appliedCoupon: { id: string; code: string } | null = null

        if (code) {
            const { data: dbCoupon } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .maybeSingle()

            const now = new Date()
            const expired = dbCoupon?.expires_at ? new Date(dbCoupon.expires_at) < now : false
            const exhausted = dbCoupon?.max_uses ? (dbCoupon.uses_count ?? 0) >= dbCoupon.max_uses : false
            const belowMinimum = dbCoupon?.min_order_value ? subtotal < Number(dbCoupon.min_order_value) : false

            if (dbCoupon && !expired && !exhausted && !belowMinimum) {
                const isPercent = String(dbCoupon.discount_type).startsWith('percent')
                discount = isPercent
                    ? (subtotal * Number(dbCoupon.discount_value)) / 100
                    : Number(dbCoupon.discount_value)
                discount = Number(Math.min(Math.max(0, discount), subtotal).toFixed(2))
                appliedCoupon = { id: dbCoupon.id, code: dbCoupon.code }
            } else {
                console.warn('[PREFERENCE] Cupom recusado:', { code, expired, exhausted, belowMinimum })
            }
        }

        const finalTotal = Number(Math.max(0, subtotal - discount + shippingPrice).toFixed(2))

        // ─── 4. Endereço ─────────────────────────────────────────────────────
        const { data: address, error: addressError } = await supabase
            .from('addresses')
            .insert({
                user_id: userId,
                name: customer.name,
                phone: customer.phone,
                zip_code: String(customer.zipCode || '').replace(/\D/g, ''),
                street: customer.street,
                number: customer.number,
                complement: customer.complement,
                neighborhood: customer.neighborhood,
                city: customer.city,
                state: customer.state,
            })
            .select()
            .single()

        if (addressError) {
            console.error('[PREFERENCE] Erro no endereço:', addressError)
            throw new Error(`Erro ao salvar endereço: ${addressError.message}`)
        }

        // ─── 5. Pedido ───────────────────────────────────────────────────────
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                subtotal,
                discount,
                shipping_cost: shippingPrice,
                total: finalTotal,
                status: 'pending',
                address_id: address.id,
                shipping_method: shippingMethod,
                shipping_label: shippingLabel,
                coupon_id: appliedCoupon?.id ?? null,
                coupon_code: appliedCoupon?.code ?? null,
            })
            .select()
            .single()

        if (orderError) {
            console.error('[PREFERENCE] Erro no pedido:', orderError)
            throw new Error(`Erro ao criar pedido: ${orderError.message}`)
        }

        // ─── 6. Itens do pedido (com os preços do servidor) ──────────────────
        const { error: itemsError } = await supabase.from('order_items').insert(
            priced.map((it) => ({
                order_id: order.id,
                variant_id: it.variantId,
                quantity: it.quantity,
                unit_price: it.unitPrice,
                total_price: Number((it.unitPrice * it.quantity).toFixed(2)),
            }))
        )
        if (itemsError) {
            console.error('[PREFERENCE] Erro nos itens:', itemsError)
            throw itemsError
        }

        // ─── 7. Preferência no Mercado Pago ──────────────────────────────────
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.colacomigoshop.com.br').replace(/\/$/, '')
        const preference = await createMercadoPagoPreference({
            external_reference: order.id,
            metadata: { order_id: order.id },
            items: [
                ...priced.map((it) => ({
                    id: it.variantId,
                    title: it.name,
                    unit_price: it.unitPrice,
                    quantity: it.quantity,
                })),
                ...(shippingPrice > 0
                    ? [{ id: 'shipping', title: `Frete — ${shippingLabel}`, unit_price: shippingPrice, quantity: 1 }]
                    : []),
            ],
            payer: { name: customer.name, email: customer.email },
            back_urls: {
                success: `${baseUrl}/checkout/sucesso?orderId=${order.id}`,
                failure: `${baseUrl}/checkout/erro?orderId=${order.id}`,
                pending: `${baseUrl}/checkout/pendente?orderId=${order.id}`,
            },
        })

        await supabase.from('orders').update({ mp_preference_id: preference.id }).eq('id', order.id)

        return NextResponse.json({
            id: preference.id,
            init_point: preference.init_point,
            orderId: order.id,
            // Totais oficiais — o front deve exibir estes, não os que calculou
            totals: { subtotal, discount, shipping: shippingPrice, total: finalTotal },
        })
    } catch (err: any) {
        console.error('[API CHECKOUT PREFERENCE ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
