'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Package, ChevronRight, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    awaiting_payment: { label: 'Ag. Pagamento', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    preparing: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function ContaPedidosClient() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login?redirect=/conta/pedidos')
                return
            }

            setUser(user)

            const { data } = await (supabase as any)
                .from('orders')
                .select(`
                    id, status, total, created_at,
                    items:order_items(
                    id,
                    variant:product_variants(
                        product:products(name, slug),
                        size, color_name
                    )
                    ),
                    shipment:shipments(tracking_code, carrier)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setOrders(data || [])
            setLoading(false)
        }
        load()
    }, [router])

    return (
        <main className="min-h-screen py-8 bg-black text-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-6 pb-6 border-b border-white/10">
                    <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tighter uppercase leading-none text-white">Meus Pedidos</h1>
                    <p className="text-neutral-500 mt-2 font-bold tracking-widest uppercase text-xs">
                        {loading ? 'Sincronizando...' : `${user?.email} · ${orders.length} pedidos`}
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin text-primary inline-block h-10 w-10" /></div>
                ) : orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                            const firstProduct = order.items?.[0]?.variant?.product

                            return (
                                <Link
                                    key={order.id}
                                    href={`/conta/pedidos/${order.id}`}
                                    className="block bg-zinc-950 border border-white/8 rounded-2xl p-6 hover:border-primary/40 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0 text-left">
                                            <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-white/5">
                                                <Package className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs font-bold text-neutral-500 mb-1">
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </p>
                                                <p className="text-sm font-black uppercase tracking-tight text-white mb-0.5 truncate">
                                                    {firstProduct?.name ?? 'Pedido'}
                                                    {(order.items?.length ?? 0) > 1 && ` +${(order.items?.length ?? 1) - 1} item(ns)`}
                                                </p>
                                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 flex-shrink-0">
                                            <span className="font-black text-primary text-lg">{formatCurrency(order.total)}</span>
                                            <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusConf.color}`}>
                                                {statusConf.label}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-zinc-950 border border-white/5 rounded-2xl">
                        <h3 className="text-xl font-black uppercase mb-4">Nenhum Drop Encontrado</h3>
                        <Link href="/produtos" className="btn-primary inline-flex items-center gap-2">
                            Iniciar Compras <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}
