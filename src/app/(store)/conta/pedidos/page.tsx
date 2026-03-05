import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Badge } from '@/components/ui/badge'
import { Package, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meus Pedidos | Cola Comigo Shop',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    awaiting_payment: { label: 'Ag. Pagamento', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    preparing: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export default async function MeusPedidosPage() {
    const supabase = await createClient()

    // Verifica se usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?redirect=/conta/pedidos')

    // Busca pedidos do usuário logado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders } = await (supabase as any)
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
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <>
            <Header />
            <main className="min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-black tracking-tight">Meus Pedidos</h1>
                        <p className="text-muted-foreground mt-1">
                            {user.email} · {orders?.length ?? 0} pedido{(orders?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {orders && orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((order: {
                                id: string; status: string; total: number; created_at: string;
                                items?: { id: string; variant?: { product?: { name: string; slug: string }; size?: string; color_name?: string } }[];
                                shipment?: { tracking_code: string; carrier: string }[]
                            }) => {
                                const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                                const firstProduct = order.items?.[0]?.variant?.product

                                return (
                                    <Link
                                        key={order.id}
                                        href={`/conta/pedidos/${order.id}`}
                                        className="block glass rounded-2xl p-4 hover:border-primary/40 border border-border/40 transition-all group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold font-mono text-sm">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {firstProduct?.name ?? 'Pedido'}
                                                        {(order.items?.length ?? 0) > 1 && ` +${(order.items?.length ?? 1) - 1} item(ns)`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="font-black text-primary">{formatCurrency(order.total)}</span>
                                                <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
                                                    {statusConf.label}
                                                </Badge>
                                                {order.shipment?.[0]?.tracking_code && (
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        📦 {order.shipment[0].tracking_code}
                                                    </span>
                                                )}
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="font-semibold">Você ainda não fez nenhum pedido</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Explore nosso catálogo e faça seu primeiro pedido!
                            </p>
                            <Link
                                href="/produtos"
                                className="inline-block mt-4 px-6 py-2 gradient-brand text-white rounded-lg font-semibold text-sm"
                            >
                                Ver Produtos
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </>
    )
}
