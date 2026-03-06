export const runtime = 'edge';
import { TrendingUp, ShoppingCart, Users, Package, DollarSign, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const METRICS = [
    {
        title: 'Receita Total',
        value: 'R$ 0,00',
        change: '—',
        icon: DollarSign,
        color: 'text-green-400',
        href: '/admin/financeiro'
    },
    {
        title: 'Pedidos Hoje',
        value: '0',
        change: '—',
        icon: ShoppingCart,
        color: 'text-blue-400',
        href: '/admin/pedidos'
    },
    {
        title: 'Clientes',
        value: '0',
        change: '—',
        icon: Users,
        color: 'text-purple-400',
        href: '/admin/clientes'
    },
    {
        title: 'Produtos Ativos',
        value: '0',
        change: '—',
        icon: Package,
        color: 'text-orange-400',
        href: '/admin/produtos'
    },
]

const ORDER_STATUSES = [
    { label: 'Pendentes', value: '0', color: 'bg-yellow-500/20 text-yellow-400', href: '/admin/pedidos?status=pending' },
    { label: 'Pagos', value: '0', color: 'bg-green-500/20 text-green-400', href: '/admin/pedidos?status=paid' },
    { label: 'Enviados', value: '0', color: 'bg-blue-500/20 text-blue-400', href: '/admin/pedidos?status=shipped' },
    { label: 'Entregues', value: '0', color: 'bg-emerald-500/20 text-emerald-400', href: '/admin/pedidos?status=delivered' },
]

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Visão geral da sua loja
                </p>
            </div>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {METRICS.map(({ title, value, change, icon: Icon, color, href }) => (
                    <Link key={title} href={href} className="block group">
                        <Card className="bg-card border-border h-full transition-all group-hover:border-primary/50 group-hover:bg-primary/[0.02]">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 pt-3 sm:pt-6 px-3 sm:px-6">
                                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    {title}
                                </CardTitle>
                                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${color} flex-shrink-0`} />
                            </CardHeader>
                            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                                <div className="text-lg sm:text-2xl font-black">{value}</div>
                                <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">{change}</p>
                                    <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Status dos pedidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="py-4 sm:py-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                            <Clock className="h-4 w-4 text-primary" />
                            Status dos Pedidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {ORDER_STATUSES.map(({ label, value, color, href }) => (
                                <Link key={label} href={href} className="block group">
                                    <div className={`rounded-xl p-3 sm:p-4 transition-all hover:ring-2 hover:ring-primary/20 ${color.split(' ')[0]}`}>
                                        <div className={`text-xl sm:text-2xl font-black ${color.split(' ')[1]}`}>
                                            {value}
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                                            <div className="text-[11px] sm:text-sm text-muted-foreground font-medium">{label}</div>
                                            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-50 group-hover:translate-x-0" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
