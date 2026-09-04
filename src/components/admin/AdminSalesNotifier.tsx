'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ShoppingCart } from '@/components/ui/icons'
import { toast } from 'sonner'

type OrderLite = {
    id: string
    status: string
    total?: number
    created_at: string
    customer_name?: string | null
    shipping_method?: string | null
    shipping_label?: string | null
}

const SHIPPING_LABELS: Record<string, string> = {
    store_pickup: 'Retirada na loja',
    local_delivery: 'Entrega local',
    correios_pac: 'Correios (PAC)',
    correios_sedex: 'Correios (SEDEX)',
    correios: 'Correios',
}

function deliveryText(order: OrderLite) {
    if (!order.shipping_method) return order.shipping_label || 'Entrega não informada'
    return SHIPPING_LABELS[order.shipping_method] || order.shipping_label || order.shipping_method
}

const STORAGE_KEY = 'admin_seen_paid_orders_v1'

function readSeenIds() {
    if (typeof window === 'undefined') return new Set<string>()
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return new Set<string>()
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return new Set<string>()
        return new Set(parsed.filter((v) => typeof v === 'string'))
    } catch {
        return new Set<string>()
    }
}

function saveSeenIds(ids: Set<string>) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
}

export function AdminSalesNotifier() {
    const [newOrders, setNewOrders] = useState<OrderLite[]>([])
    const seenIdsRef = useRef<Set<string>>(new Set())
    const initializedRef = useRef(false)

    useEffect(() => {
        seenIdsRef.current = readSeenIds()
        let timer: NodeJS.Timeout | null = null

        const scheduleNext = () => {
            if (timer) clearTimeout(timer)
            const isHidden = typeof document !== 'undefined' && document.hidden
            // 15 segundos na aba ativa, 60 segundos em background (economiza recursos e evita excesso de conexões)
            const interval = isHidden ? 60000 : 15000
            timer = setTimeout(poll, interval)
        }

        const poll = async () => {
            try {
                // Payload enxuto e limitado
                const res = await fetch('/api/admin/orders?status=paid&fields=lite&limit=20', { cache: 'no-store' })
                if (!res.ok) return
                const data = await res.json()
                const orders = (Array.isArray(data) ? data : data.orders || []) as OrderLite[]
                const paidOrders = orders
                    .filter((o) => o.status === 'paid')
                    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

                if (!initializedRef.current) {
                    paidOrders.forEach((o) => seenIdsRef.current.add(o.id))
                    saveSeenIds(seenIdsRef.current)
                    initializedRef.current = true
                    return
                }

                const unseen = paidOrders.filter((o) => !seenIdsRef.current.has(o.id))
                if (unseen.length === 0) return

                unseen.forEach((order) => {
                    toast.success('Nova compra realizada', {
                        description: `Pedido #${order.id.slice(0, 8).toUpperCase()} · ${deliveryText(order)} · estoque atualizado.`,
                    })
                })

                setNewOrders((prev) => {
                    const map = new Map(prev.map((o) => [o.id, o]))
                    unseen.forEach((o) => map.set(o.id, o))
                    return Array.from(map.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                })
            } catch {
                // polling silencioso
            } finally {
                scheduleNext()
            }
        }

        const handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && !document.hidden) {
                // Ao retornar para a aba do admin, checa imediatamente
                if (timer) clearTimeout(timer)
                poll()
            }
        }

        poll()
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange)
        }

        return () => {
            if (timer) clearTimeout(timer)
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            }
        }
    }, [])

    const unreadCount = newOrders.length

    const latest = useMemo(() => newOrders.slice(0, 3), [newOrders])

    function markAllAsRead() {
        setNewOrders((current) => {
            current.forEach((o) => seenIdsRef.current.add(o.id))
            saveSeenIds(seenIdsRef.current)
            return []
        })
    }

    if (unreadCount === 0) return null

    return (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[320px] rounded-xl border border-primary/30 bg-background shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Novas vendas ({unreadCount})</p>
                </div>
                <button onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground">
                    Marcar lidas
                </button>
            </div>
            <div className="max-h-64 overflow-auto">
                {latest.map((order) => (
                    <Link
                        key={order.id}
                        href={`/admin/pedidos/${order.id}`}
                        className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-secondary/40 transition-colors"
                    >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {order.customer_name || 'Cliente'} - {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-primary/80 truncate">{deliveryText(order)}</p>
                        </div>
                    </Link>
                ))}
            </div>
            <Link
                href="/admin/pedidos"
                onClick={markAllAsRead}
                className="block text-center text-xs font-medium py-2 hover:bg-secondary/50 transition-colors"
            >
                Ir para pedidos
            </Link>
        </div>
    )
}
