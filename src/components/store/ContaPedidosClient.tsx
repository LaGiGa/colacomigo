'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Package, Loader2, ArrowRight, LogOut, X, MapPin, Truck, Calendar, ShoppingCart, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

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
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    // Pega o ID do pedido da URL
    const selectedOrderId = searchParams.get('pedido')
    const selectedOrder = orders.find(o => o.id === selectedOrderId)

    useEffect(() => {
        async function load() {
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
                    subtotal, shipping_cost, discount,
                    items:order_items(
                        id, quantity, unit_price,
                        variant:product_variants(
                            product:products(name, slug, product_images(url)),
                            size, color_name
                        )
                    ),
                    shipment:shipments(tracking_code, carrier),
                    address:addresses(*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setOrders(data || [])
            setLoading(false)
        }
        load()
    }, [router, supabase])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <main className="min-h-screen py-12 bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-primary h-10 w-10" />
            </main>
        )
    }

    // VISÃO DE DETALHES
    if (selectedOrder) {
        const statusConf = STATUS_CONFIG[selectedOrder.status] ?? STATUS_CONFIG.pending
        
        return (
            <main className="min-h-screen py-8 bg-black text-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <button 
                        onClick={() => router.push('/conta/pedidos')}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white mb-8 group transition-colors uppercase text-[10px] font-black tracking-widest"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para a Lista
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-10 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusConf.color}`}>
                                    {statusConf.label}
                                </span>
                                <span className="text-neutral-600 font-mono text-xs">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Detalhes do Pedido</h1>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                Realizado em {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="text-3xl font-black text-primary leading-none">{formatCurrency(selectedOrder.total)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Itens do Pedido */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                <ShoppingCart className="h-4 w-4 text-primary" /> Itens do Drop
                            </h3>
                            {selectedOrder.items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 p-4 bg-zinc-950 border border-white/5 rounded-2xl group hover:border-white/15 transition-colors">
                                    <div className="h-20 w-20 bg-zinc-900 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                                        {item.variant?.product?.product_images?.[0]?.url ? (
                                            <img src={item.variant.product.product_images[0].url} alt={item.variant.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="h-8 w-8 text-neutral-800 m-auto" />
                                        )}
                                    </div>
                                    <div className="flex-1 py-1 text-left">
                                        <h4 className="text-sm font-black uppercase tracking-tight text-white line-clamp-1">{item.variant?.product?.name}</h4>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                                            {item.variant?.size && `Tam: ${item.variant.size}`} {item.variant?.color_name && ` · Cor: ${item.variant.color_name}`}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 text-left leading-none">
                                            <p className="text-xs font-mono font-bold text-neutral-400">{item.quantity}x {formatCurrency(item.unit_price)}</p>
                                            <p className="text-sm font-black text-white">{formatCurrency(item.unit_price * item.quantity)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl space-y-3">
                                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <span>Frete</span>
                                    <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-green-500 uppercase tracking-widest">
                                        <span>Desconto</span>
                                        <span>-{formatCurrency(selectedOrder.discount)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-primary">
                                    <span className="font-black uppercase tracking-tighter text-lg">Total</span>
                                    <span className="font-black text-2xl tracking-tighter">{formatCurrency(selectedOrder.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Endereço e Entrega */}
                        <div className="space-y-6">
                            <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-left">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <MapPin className="h-4 w-4 text-primary" /> Endereço de Entrega
                                </h3>
                                {selectedOrder.address ? (
                                    <div className="space-y-1">
                                        <p className="text-white font-black uppercase text-sm tracking-tight">{selectedOrder.address.name}</p>
                                        <p className="text-neutral-400 text-sm font-bold">
                                            {selectedOrder.address.street}, {selectedOrder.address.number}
                                            {selectedOrder.address.complement && ` - ${selectedOrder.address.complement}`}
                                        </p>
                                        <p className="text-neutral-400 text-sm font-bold">
                                            {selectedOrder.address.neighborhood} · {selectedOrder.address.city} - {selectedOrder.address.state}
                                        </p>
                                        <p className="text-neutral-500 text-xs font-mono mt-2">{selectedOrder.address.zip_code}</p>
                                    </div>
                                ) : (
                                    <p className="text-neutral-500 text-xs italic font-bold">Informações de endereço não disponíveis.</p>
                                )}
                            </div>

                            <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-left">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <Truck className="h-4 w-4 text-primary" /> Entrega
                                </h3>
                                {selectedOrder.shipment ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Carrier / Método</p>
                                            <p className="text-sm font-black text-white uppercase">{selectedOrder.shipment.carrier || 'Padrão'}</p>
                                        </div>
                                        {selectedOrder.shipment.tracking_code && (
                                            <div>
                                                <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Código de Rastreio</p>
                                                <p className="text-sm font-mono font-black text-primary select-all">{selectedOrder.shipment.tracking_code}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                        <Calendar className="h-5 w-5 text-neutral-600" />
                                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                            Aguardando processamento logístico.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen py-8 bg-black text-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-start justify-between gap-3 text-left">
                        <div>
                            <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tighter uppercase leading-none text-white">Meus Pedidos</h1>
                            <p className="text-neutral-500 mt-2 font-bold tracking-widest uppercase text-xs">
                                {loading ? 'Sincronizando...' : `${user?.email} · ${orders.length} pedidos`}
                            </p>
                        </div>
                        {user && (
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white/30 transition-all rounded-full"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Sair da Conta
                            </button>
                        )}
                    </div>
                </div>

                {orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                            const firstProduct = order.items?.[0]?.variant?.product

                            return (
                                <Link
                                    key={order.id}
                                    href={`/conta/pedidos?pedido=${order.id}`}
                                    className="block bg-zinc-950 border border-white/8 rounded-2xl p-6 hover:border-primary/40 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0 text-left">
                                            <div className="h-14 w-14 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-white/5 relative">
                                                <Package className="h-6 w-6 text-primary" />
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-mono text-[10px] font-bold text-neutral-500">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${statusConf.color}`}>
                                                        {statusConf.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-tight text-white mb-0.5 truncate leading-none">
                                                    {firstProduct?.name ?? 'Pedido'}
                                                    {(order.items?.length ?? 0) > 1 && ` +${(order.items?.length ?? 1) - 1} item(ns)`}
                                                </p>
                                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 flex-shrink-0">
                                            <span className="font-black text-primary text-xl tracking-tighter">{formatCurrency(order.total)}</span>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                                Ver Detalhes <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-zinc-950/50 border border-white/5 rounded-3xl">
                        <div className="h-20 w-20 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-left">
                            <ShoppingCart className="h-10 w-10 text-neutral-800" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Nenhum Drop Encontrado</h3>
                        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mb-8">Você ainda não realizou compras conosco.</p>
                        <Link href="/produtos" className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-black text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95">
                            Explorar Coleção <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}
