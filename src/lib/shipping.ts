/**
 * Rótulos do tipo de entrega gravado em `orders.shipping_method`.
 * Compartilhado entre painel administrativo e notificações.
 */

export const SHIPPING_METHOD_LABELS: Record<string, string> = {
    store_pickup: 'Retirada na loja',
    local_delivery: 'Entrega local',
    palmas_local: 'Entrega local',
    correios: 'Correios',
    correios_pac: 'Correios (PAC)',
    correios_sedex: 'Correios (SEDEX)',
    pac: 'Correios (PAC)',
    sedex: 'Correios (SEDEX)',
}

export interface ShippingAware {
    shipping_method?: string | null
    shipping_label?: string | null
}

/** Texto amigável do tipo de entrega de um pedido. */
export function shippingMethodLabel(order: ShippingAware): string {
    if (!order?.shipping_method) return order?.shipping_label || 'Não informado'
    return SHIPPING_METHOD_LABELS[order.shipping_method] || order.shipping_label || order.shipping_method
}

/** Classe de cor para destacar retirada (azul) x envio (laranja). */
export function shippingMethodTone(order: ShippingAware): string {
    if (order?.shipping_method === 'store_pickup') return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    if (order?.shipping_method === 'local_delivery' || order?.shipping_method === 'palmas_local') {
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    }
    return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
}

/** true quando o cliente vai buscar na loja (não precisa de endereço de entrega). */
export function isStorePickup(order: ShippingAware): boolean {
    return order?.shipping_method === 'store_pickup'
}
