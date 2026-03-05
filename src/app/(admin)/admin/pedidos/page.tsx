import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Eye, Package, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pedidos | Admin' }

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

export default async function AdminPedidosPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: orders } = await supabase
        .from('orders')
        .select(`
      id, status, total, created_at, mp_payment_id,
      shipping_address:addresses(name, city, state),
      items:order_items(id)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground mt-1">{orders?.length ?? 0} pedidos no total</p>
                </div>
                {/* Filtros rápidos por status */}
                <div className="flex gap-2 flex-wrap">
                    {(['paid', 'shipped', 'delivered'] as const).map((s) => (
                        <Badge key={s} variant="outline" className={`${STATUS_CONFIG[s].color} cursor-pointer text-xs`}>
                            {STATUS_CONFIG[s].label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            <div className="rounded-xl border border-border overflow-x-auto">
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
                            orders.map((order: {
                                id: string; status: string; total: number; created_at: string;
                                mp_payment_id?: string;
                                shipping_address?: { name?: string; city?: string; state?: string };
                                items?: { id: string }[]
                            }) => {
                                const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                                const date = new Date(order.created_at)

                                return (
                                    <tr key={order.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                        <td className="p-4">
                                            <p className="font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            {order.mp_payment_id && (
                                                <p className="text-xs text-muted-foreground">MP: {order.mp_payment_id}</p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{order.shipping_address?.name ?? '—'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.shipping_address?.city}/{order.shipping_address?.state}
                                            </p>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <p>{date.toLocaleDateString('pt-BR')}</p>
                                            <p className="text-xs">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{order.items?.length ?? 0}</td>
                                        <td className="p-4">
                                            <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
                                                {statusConf.label}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/pedidos/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum pedido recebido ainda.</p>
                                    <p className="text-xs mt-1">Os pedidos aparecem aqui após o primeiro checkout.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
