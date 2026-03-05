import { createAdminClient } from '@/lib/supabase/server'
import { TrendingUp, DollarSign, ShoppingCart, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Financeiro | Admin' }

interface Order {
    id: string
    total: number
    status: string
    created_at: string
    items: { id: string }[]
}

export default async function AdminFinanceiroPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: orders } = await supabase
        .from('orders')
        .select('id, total, status, created_at, items:order_items(id)')
        .order('created_at', { ascending: false })

    const allOrders: Order[] = orders ?? []

    // ─── Métricas ─────────────────────────────────────────
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const paidOrders = allOrders.filter(o =>
        ['paid', 'preparing', 'shipped', 'delivered'].includes(o.status)
    )
    const thisMonthOrders = paidOrders.filter(o => new Date(o.created_at) >= startOfMonth)
    const lastMonthOrders = paidOrders.filter(o => {
        const d = new Date(o.created_at)
        return d >= startOfLastMonth && d <= endOfLastMonth
    })

    const totalReceita = paidOrders.reduce((s, o) => s + o.total, 0)
    const receitaMes = thisMonthOrders.reduce((s, o) => s + o.total, 0)
    const receitaUltimoMes = lastMonthOrders.reduce((s, o) => s + o.total, 0)
    const variacaoMes = receitaUltimoMes > 0
        ? ((receitaMes - receitaUltimoMes) / receitaUltimoMes) * 100
        : 0

    const ticketMedio = paidOrders.length > 0 ? totalReceita / paidOrders.length : 0

    // ─── Pedidos por dia (últimos 14 dias) ────────────────
    const last14: { date: string; total: number; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        const dayOrders = paidOrders.filter(o => {
            const od = new Date(o.created_at)
            return od.toDateString() === d.toDateString()
        })
        last14.push({
            date: dateStr,
            total: dayOrders.reduce((s, o) => s + o.total, 0),
            count: dayOrders.length,
        })
    }

    const maxTotal = Math.max(...last14.map(d => d.total), 1)

    // ─── Status breakdown ─────────────────────────────────
    const statusBreakdown = [
        { key: 'pending', label: 'Pendentes', color: 'bg-yellow-500' },
        { key: 'awaiting_payment', label: 'Ag. Pagamento', color: 'bg-orange-500' },
        { key: 'paid', label: 'Pagos', color: 'bg-green-500' },
        { key: 'preparing', label: 'Preparando', color: 'bg-blue-500' },
        { key: 'shipped', label: 'Enviados', color: 'bg-purple-500' },
        { key: 'delivered', label: 'Entregues', color: 'bg-emerald-500' },
        { key: 'cancelled', label: 'Cancelados', color: 'bg-red-500' },
    ].map(s => ({
        ...s,
        count: allOrders.filter(o => o.status === s.key).length,
        value: allOrders.filter(o => o.status === s.key).reduce((acc, o) => acc + o.total, 0),
    }))

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Financeiro</h1>
                <p className="text-muted-foreground mt-1">Receitas, pedidos e métricas da loja</p>
            </div>

            {/* ─── Cards de Métricas ─────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Receita Total',
                        value: formatCurrency(totalReceita),
                        icon: DollarSign,
                        color: 'text-green-400',
                        bg: 'bg-green-500/10',
                        sub: `${paidOrders.length} pedidos pagos`,
                    },
                    {
                        label: 'Receita do Mês',
                        value: formatCurrency(receitaMes),
                        icon: TrendingUp,
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10',
                        sub: variacaoMes !== 0
                            ? `${variacaoMes > 0 ? '+' : ''}${variacaoMes.toFixed(1)}% vs mês passado`
                            : 'Primeiro mês',
                        trend: variacaoMes,
                    },
                    {
                        label: 'Pedidos no Mês',
                        value: thisMonthOrders.length.toString(),
                        icon: ShoppingCart,
                        color: 'text-purple-400',
                        bg: 'bg-purple-500/10',
                        sub: `${allOrders.filter(o => o.status === 'pending').length} pendentes`,
                    },
                    {
                        label: 'Ticket Médio',
                        value: formatCurrency(ticketMedio),
                        icon: Package,
                        color: 'text-orange-400',
                        bg: 'bg-orange-500/10',
                        sub: 'por pedido pago',
                    },
                ].map(({ label, value, icon: Icon, color, bg, sub, trend }) => (
                    <div key={label} className="rounded-xl border border-border p-5 bg-card space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-medium">{label}</p>
                            <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                                <Icon className={`h-4 w-4 ${color}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <div className="flex items-center gap-1">
                            {trend !== undefined && trend !== 0 && (
                                trend > 0
                                    ? <ArrowUpRight className="h-3 w-3 text-green-400" />
                                    : <ArrowDownRight className="h-3 w-3 text-red-400" />
                            )}
                            <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Gráfico de barras — últimos 14 dias ─────── */}
            <div className="rounded-xl border border-border p-6 bg-card">
                <h2 className="font-bold text-sm mb-6 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Receita — Últimos 14 dias
                </h2>
                <div className="flex items-end gap-2 h-40">
                    {last14.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                            {/* Barra */}
                            <div className="w-full relative flex items-end justify-center" style={{ height: '120px' }}>
                                <div
                                    className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t transition-colors relative"
                                    style={{ height: `${(day.total / maxTotal) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                                >
                                    {day.total > 0 && (
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black border border-border rounded px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {formatCurrency(day.total)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Label */}
                            <span className="text-[9px] text-muted-foreground">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Status dos pedidos ──────────────────────── */}
            <div className="rounded-xl border border-border p-6 bg-card">
                <h2 className="font-bold text-sm mb-4">Breakdown por Status</h2>
                <div className="space-y-3">
                    {statusBreakdown.filter(s => s.count > 0).map((s) => (
                        <div key={s.key} className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${s.color}`} />
                            <span className="text-sm text-muted-foreground w-32">{s.label}</span>
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${s.color} rounded-full`}
                                    style={{ width: `${(s.count / allOrders.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold w-8 text-right">{s.count}</span>
                            <span className="text-xs text-muted-foreground w-24 text-right">{formatCurrency(s.value)}</span>
                        </div>
                    ))}
                    {statusBreakdown.every(s => s.count === 0) && (
                        <p className="text-muted-foreground text-sm text-center py-4">
                            Nenhum pedido registrado ainda.
                        </p>
                    )}
                </div>
            </div>

            {/* ─── Últimos 5 pedidos ───────────────────────── */}
            {allOrders.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-secondary/30">
                        <h2 className="font-bold text-sm">Últimos Pedidos</h2>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            {allOrders.slice(0, 5).map((order) => (
                                <tr key={order.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                    <td className="p-4 font-mono">#{order.id.slice(0, 8).toUpperCase()}</td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-primary font-bold">{formatCurrency(order.total)}</span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{order.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
