'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Eye, Package, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    awaiting_payment: { label: 'Ag. Pagamento', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    preparing: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    refunded: { label: 'Reembolsado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function PedidosAdminClient({ initialOrders = [] }: { initialOrders?: any[] }) {
    const [orders, setOrders] = useState<any[]>(initialOrders)
    const [loading, setLoading] = useState(initialOrders.length === 0)

    useEffect(() => {
        if (initialOrders.length === 0) {
            fetch('/api/admin/orders')
                .then(res => res.json())
                .then(data => {
                    setOrders(data)
                    setLoading(false)
                })
        }
    }, [initialOrders])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground mt-1">{orders?.length ?? 0} pedidos no total</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['paid', 'shipped', 'delivered'] as const).map((s) => (
                        <Badge key={s} variant="outline" className={`${STATUS_CONFIG[s].color} text-xs`}>
                            {STATUS_CONFIG[s].label}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold">Pedido</th>
                            <th className="text-left p-4 font-semibold">Cliente</th>
                            <th className="text-left p-4 font-semibold">Data</th>
                            <th className="text-left p-4 font-semibold">Itens</th>
                            <th className="text-left p-4 font-semibold">Total</th>
                            <th className="text-left p-4 font-semibold">Status</th>
                            <th className="text-left p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders && orders.length > 0 ? (
                            orders.map((order: any) => {
                                const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                                const date = new Date(order.created_at)
                                return (
                                    <tr key={order.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                        <td className="p-4">
                                            <p className="font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            {order.mp_payment_id && <p className="text-xs text-muted-foreground">MP: {order.mp_payment_id}</p>}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{order.shipping_address?.name ?? '—'}</p>
                                            <p className="text-xs text-muted-foreground">{order.shipping_address?.city}/{order.shipping_address?.state}</p>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <p>{date.toLocaleDateString('pt-BR')}</p>
                                            <p className="text-xs">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{order.items?.length ?? 0}</td>
                                        <td className="p-4"><span className="font-bold text-primary">{formatCurrency(order.total)}</span></td>
                                        <td className="p-4"><Badge variant="outline" className={`text-xs ${statusConf.color}`}>{statusConf.label}</Badge></td>
                                        <td className="p-4"><Button variant="ghost" size="sm" asChild><Link href={`/admin/pedidos/${order.id}`}><Eye className="h-4 w-4" /></Link></Button></td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan={7} className="p-12 text-center text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum pedido recebido ainda.</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders && orders.length > 0 ? (
                    orders.map((order: any) => {
                        const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                        const date = new Date(order.created_at)
                        return (
                            <div key={order.id} className="rounded-xl border border-border p-4 bg-card space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Pedido</span><span className="font-mono font-bold text-white">#{order.id.slice(0, 8).toUpperCase()}</span></div>
                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${statusConf.color}`}>{statusConf.label}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Cliente</span><span className="text-sm font-medium truncate">{order.shipping_address?.name ?? '—'}</span><span className="text-[10px] text-muted-foreground">{order.shipping_address?.city}/{order.shipping_address?.state}</span></div>
                                    <div className="flex flex-col text-right"><span className="text-[10px] text-muted-foreground uppercase font-bold">Total</span><span className="text-sm font-black text-primary">{formatCurrency(order.total)}</span><span className="text-[10px] text-muted-foreground">{order.items?.length ?? 0} item(ns)</span></div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3 w-3" /><span className="text-[10px]">{date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" asChild><Link href={`/admin/pedidos/${order.id}`}>Ver Detalhes</Link></Button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl"><p>Nenhum pedido recebido.</p></div>
                )}
            </div>
        </div>
    )
}
