'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { ChevronLeft, Loader2, Package, Truck } from '@/components/ui/icons'
import Link from 'next/link'
import { OrderStatusUpdater } from './OrderStatusUpdater'

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

interface Props {
    order: any
    id: string
}

import { useState, useEffect } from 'react'


export function PedidoDetailClient({ order: initialOrder, id }: Props) {
    const [order, setOrder] = useState<any>(initialOrder)
    const [loading, setLoading] = useState(!initialOrder)

    useEffect(() => {
        if (!initialOrder) {
            fetch(`/api/admin/orders/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.order) setOrder(data.order)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [initialOrder, id])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    if (!order) return <div className="p-10 text-center">Pedido não encontrado</div>

    const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/pedidos" className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black tracking-tight">
                        Pedido #{id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                </div>
                <Badge variant="outline" className={`text-sm px-3 py-1 ${statusConf.color}`}>
                    {statusConf.label}
                </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Itens do Pedido */}
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-xl border border-border p-4 space-y-3">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Itens do Pedido
                        </h2>
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                <div>
                                    <p className="font-medium">{item.variant?.product?.name ?? 'Produto'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        SKU: {item.variant?.sku}
                                        {item.variant?.size && ` · Tamanho: ${item.variant.size}`}
                                        {item.variant?.color_name && ` · Cor: ${item.variant.color_name}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{formatCurrency(item.total_price)}</p>
                                    <p className="text-xs text-muted-foreground">{item.quantity}x {formatCurrency(item.unit_price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totais */}
                    <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Frete</span>
                            <span>{formatCurrency(order.shipping_cost)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span>Desconto</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <Separator className="bg-border/40" />
                        <div className="flex justify-between font-black text-base">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(order.total)}</span>
                        </div>
                    </div>

                    {/* Atualizar Status */}
                    <OrderStatusUpdater
                        orderId={order.id}
                        currentStatus={order.status}
                        currentTrackingCode={order.shipment?.[0]?.tracking_code ?? ''}
                        customerName={order.customer_name || order.shipping_address?.name || 'Cliente'}
                        customerPhone={order.customer_phone || order.shipping_address?.phone || ''}
                    />
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                        <h2 className="font-semibold">Cliente</h2>
                        <p>{order.customer_name || order.shipping_address?.name || '—'}</p>
                        <p className="text-muted-foreground">{order.customer_email || 'Sem email'}</p>
                        <p className="text-muted-foreground">{order.customer_phone || order.shipping_address?.phone || 'Sem telefone'}</p>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            Endereço de Entrega
                        </h2>
                        {order.shipping_address ? (
                            <div className="text-muted-foreground space-y-0.5">
                                <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                                {order.shipping_address.complement && <p>{order.shipping_address.complement}</p>}
                                <p>{order.shipping_address.neighborhood}</p>
                                <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                                <p>CEP: {order.shipping_address.zip_code}</p>
                            </div>
                        ) : <p className="text-muted-foreground">Endereço não encontrado</p>}
                    </div>

                    {/* Pagamento */}
                    {order.transactions?.[0] && (
                        <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                            <h2 className="font-semibold">Pagamento</h2>
                            <div className="text-muted-foreground">
                                <p>ID MP: {order.transactions[0].mp_payment_id}</p>
                                <p>Método: {order.transactions[0].method}</p>
                                <p>Status: {order.transactions[0].status}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
