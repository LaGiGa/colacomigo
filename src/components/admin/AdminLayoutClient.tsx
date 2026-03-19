'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Boxes, Layers, Layout, LayoutDashboard, LogOut, MessageCircle, MoreHorizontal, Package, Settings2, ShoppingCart, Store, Tag, Ticket, TrendingUp, Truck, User, Users, X } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AdminSalesNotifier } from '@/components/admin/AdminSalesNotifier'

// ─── Itens principais (bottom nav mobile) ──────────────
const MAIN_NAV = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
    { label: 'Produtos', href: '/admin/produtos', icon: Package },
    { label: 'Financeiro', href: '/admin/financeiro', icon: TrendingUp },
]

// ─── Itens secundários (Categorizados por Ordem Alfabética) ───────────
const SECONDARY_NAV = [
    { label: 'Banners', href: '/admin/banners', icon: Layout },
    { label: 'Categorias', href: '/admin/categorias', icon: Tag },
    { label: 'Clientes', href: '/admin/clientes', icon: Users },
    { label: 'Coleções', href: '/admin/colecoes', icon: Layers },
    { label: 'Configurações', href: '/admin/configuracoes', icon: Settings2 },
    { label: 'Cupons', href: '/admin/cupons', icon: Ticket },
    { label: 'Depoimentos', href: '/admin/depoimentos', icon: MessageCircle },
    { label: 'Frete', href: '/admin/frete', icon: Truck },
    { label: 'Marcas', href: '/admin/marcas', icon: Boxes },
]

// ALL_NAV para o Sidebar (Dashboard + Alfabético)
const ALL_NAV = [
    MAIN_NAV[0], // Dashboard sempre no topo
    ...[...MAIN_NAV.slice(1), ...SECONDARY_NAV].sort((a, b) => a.label.localeCompare(b.label))
]

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const isActive = (href: string) =>
        href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

    return (
        <div className="flex min-h-screen bg-background">

            {/* ══════════════════════════════════════════
                SIDEBAR — Desktop only (lg+)
            ══════════════════════════════════════════ */}
            <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-border flex-col">
                {/* Logo */}
                <div className="px-6 py-5 flex flex-col items-center">
                    <Link href="/admin" className="flex items-center justify-center">
                        <Image src="/logoh.png" alt="Cola Comigo" width={160} height={48} className="h-10 w-auto object-contain" />
                    </Link>
                    <span className="text-[9px] text-muted-foreground tracking-widest mt-1 block uppercase text-center w-full">ADMINISTRATIVO</span>
                </div>
                <Separator />

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-0.5">
                    {ALL_NAV.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                                isActive(href)
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {label}
                        </Link>
                    ))}
                </nav>

                <Separator />
                <div className="p-4 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <Store className="h-4 w-4" />
                        Ver Loja
                    </Link>
                    <form action="/api/auth/signout" method="POST">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </form>
                </div>
            </aside>

            {/* ══════════════════════════════════════════
                MAIN CONTENT
            ══════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar — Mobile only */}
                <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
                    <Link href="/admin" className="flex items-center">
                        <Image src="/logoh.png" alt="Cola Comigo" width={130} height={36} className="h-8 w-auto object-contain" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                            <Store className="h-5 w-5" />
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
                    {children}
                </main>
            </div>

            <AdminSalesNotifier />

            {/* ══════════════════════════════════════════
                BOTTOM NAV — Mobile only
            ══════════════════════════════════════════ */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
                <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
                    {MAIN_NAV.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-colors',
                                isActive(href)
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <Icon className={cn('h-5 w-5', isActive(href) && 'stroke-[2.5]')} />
                            <span className={cn('text-[10px] font-medium', isActive(href) && 'font-bold')}>{label}</span>
                            {isActive(href) && <span className="h-0.5 w-4 rounded-full bg-primary mt-0.5" />}
                        </Link>
                    ))}

                    {/* Mais → abre drawer */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className={cn(
                            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-colors',
                            SECONDARY_NAV.some(n => isActive(n.href))
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Mais</span>
                        {SECONDARY_NAV.some(n => isActive(n.href)) && (
                            <span className="h-0.5 w-4 rounded-full bg-primary mt-0.5" />
                        )}
                    </button>
                </div>
            </nav>

            {/* ══════════════════════════════════════════
                DRAWER "MAIS" — Mobile
            ══════════════════════════════════════════ */}
            {drawerOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Sheet */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border animate-in slide-in-from-bottom duration-300">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-border" />
                        </div>
                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-sm font-bold">Menu</span>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                            {SECONDARY_NAV.map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setDrawerOpen(false)}
                                    className={cn(
                                        'flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-colors',
                                        isActive(href)
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'border-border text-muted-foreground hover:bg-secondary'
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                    <span className="text-xs">{label}</span>
                                </Link>
                            ))}
                            {/* Ver loja */}
                            <Link
                                href="/"
                                onClick={() => setDrawerOpen(false)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border text-muted-foreground hover:bg-secondary text-sm font-medium transition-colors"
                            >
                                <Store className="h-6 w-6" />
                                <span className="text-xs">Ver Loja</span>
                            </Link>
                        </div>
                        <div className="h-6" /> {/* Safe area */}
                    </div>
                </>
            )}
        </div>
    )
}
