'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

type OrderLite = {
    id: string
    status: string
    total?: number
    created_at: string
    shipping_address?: { name?: string | null } | null
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

        const poll = async () => {
            try {
                const res = await fetch('/api/admin/orders', { cache: 'no-store' })
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
                        description: `Pedido #${order.id.slice(0, 8).toUpperCase()} confirmado.`,
                    })
                })

                setNewOrders((prev) => {
                    const map = new Map(prev.map((o) => [o.id, o]))
                    unseen.forEach((o) => map.set(o.id, o))
                    return Array.from(map.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                })
            } catch {
                // polling silencioso
            }
        }

        poll()
        const timer = setInterval(poll, 10000)
        return () => clearInterval(timer)
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
                                {order.shipping_address?.name || 'Cliente'} - {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
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
