'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowLeft } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    awaiting_payment: { label: 'Ag. Pagamento', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    preparing: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

interface Props {
    id: string
}

export function ContaPedidoDetalheClient({ id }: Props) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<any>(null)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push(`/login?redirect=/conta/pedidos/${id}`)
                return
            }

            const { data } = await (supabase as any)
                .from('orders')
                .select(`
                    id, status, total, subtotal, shipping_cost, discount, created_at,
                    items:order_items(
                        id, quantity, unit_price, total_price,
                        variant:product_variants(
                            size, color_name,
                            product:products(name, slug)
                        )
                    ),
                    transactions:payment_transactions(mp_payment_id, method, status, amount, created_at)
                `)
                .eq('id', id)
                .eq('user_id', user.id)
                .maybeSingle()

            setOrder(data ?? null)
            setLoading(false)
        }

        load()
    }, [id, router, supabase])

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </main>
        )
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-black text-white py-10 px-4">
                <div className="max-w-3xl mx-auto border border-white/10 p-6">
                    <p className="text-sm text-neutral-400 mb-4">Pedido nao encontrado.</p>
                    <Link href="/conta/pedidos" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Voltar para meus pedidos
                    </Link>
                </div>
            </main>
        )
    }

    const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

    return (
        <main className="min-h-screen bg-black text-white py-8 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                        <Link href="/conta/pedidos" className="text-xs text-neutral-500 hover:text-white inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                        </Link>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
                        <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusConf.color}`}>
                        {statusConf.label}
                    </div>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Itens</h2>
                    <div className="space-y-2">
                        {(order.items || []).map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-b-0">
                                <div>
                                    <p className="text-sm font-black uppercase">{item.variant?.product?.name ?? 'Produto'}</p>
                                    <p className="text-[11px] text-neutral-500">
                                        Qtd {item.quantity}
                                        {item.variant?.size ? ` · Tam ${item.variant.size}` : ''}
                                        {item.variant?.color_name ? ` · ${item.variant.color_name}` : ''}
                                    </p>
                                </div>
                                <p className="font-black">{formatCurrency(item.total_price)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 text-[11px] font-bold uppercase tracking-wider space-y-2">
                    <div className="flex justify-between text-neutral-400">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                        <span>Frete</span>
                        <span>{formatCurrency(order.shipping_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                        <span>Desconto</span>
                        <span>-{formatCurrency(order.discount || 0)}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between text-white text-sm">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(order.total || 0)}</span>
                    </div>
                </div>
            </div>
        </main>
    )
}
