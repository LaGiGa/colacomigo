'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Menu, Search, X, User, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Dados de navegação ───────────────────────────────────────────────────────
const CATEGORIAS = [
    {
        label: 'Camisas',
        href: '/categorias/camisas',
        subs: ['Camisa Grife', 'Camisa Streetwear'],
        subHrefs: ['/categorias/camisas?sub=grife', '/categorias/camisas?sub=streetwear'],
    },
    {
        label: "Short's",
        href: '/categorias/shorts',
        subs: ['Short Trip Side', 'Short Premium'],
        subHrefs: ['/categorias/shorts?sub=trip-side', '/categorias/shorts?sub=premium'],
    },
    {
        label: 'Calças',
        href: '/categorias/calcas',
        subs: ['Calça Baggy', 'Calça Cargo', 'Calça Jogger'],
        subHrefs: ['/categorias/calcas?sub=baggy', '/categorias/calcas?sub=cargo', '/categorias/calcas?sub=jogger'],
    },
    { label: 'Bonés', href: '/categorias/bones', subs: [], subHrefs: [] },
    { label: 'Tênis', href: '/categorias/tenis', subs: [], subHrefs: [] },
    { label: 'Casacos', href: '/categorias/casacos', subs: [], subHrefs: [] },
    { label: 'Chinelos', href: '/categorias/chinelos', subs: [], subHrefs: [] },
    {
        label: 'Bag',
        href: '/categorias/bags',
        subs: ['Bag Grife', 'Bag Streetwear'],
        subHrefs: ['/categorias/bags?sub=grife', '/categorias/bags?sub=streetwear'],
    },
]

// ─── Componente Header ────────────────────────────────────────────────────────
export function Header() {
    const totalItems = useCartStore((s) => s.totalItems())
    const toggleCart = useUIStore((s) => s.toggleCart)
    const router = useRouter()

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [scrolled, setScrolled] = useState(false)

    // Mobile: nível de navegação (null = raiz, objeto = nível 2 de subcategorias)
    const [mobileLevel, setMobileLevel] = useState<null | { label: string; subs: string[]; subHrefs: string[] }>(null)

    const mobileSearchRef = useRef<HTMLInputElement>(null)

    // Scroll shadow no header
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    // Bloqueia scroll do body quando drawer aberto
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [drawerOpen])

    function handleMobileSearch(e: React.FormEvent) {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/produtos?busca=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }

    function openDrawer() {
        setMobileLevel(null)
        setDrawerOpen(true)
    }

    return (
        <>
            {/* ══════════════════════════════════════════════════════════════
                HEADER PRINCIPAL
            ══════════════════════════════════════════════════════════════ */}
            <header
                className="sticky top-0 z-50 w-full bg-black"
                style={{ borderBottom: scrolled ? '1px solid #1a1a1a' : '1px solid transparent' }}
            >
                {/* ── Linha 1: hamburger | logo | ações ── */}
                <div className="container-store">
                    <div className="flex h-[56px] items-center gap-3">

                        {/* Hamburguer (somente mobile) */}
                        <button
                            onClick={openDrawer}
                            className="tap-target text-white lg:hidden flex-shrink-0"
                            aria-label="Abrir menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Logo — centralizada em mobile, à esquerda em desktop */}
                        <Link
                            href="/"
                            className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:mr-6 flex items-center"
                            aria-label="Cola Comigo Shop"
                        >
                            <Image
                                src="/logoh.png"
                                alt="Cola Comigo Shop"
                                width={160}
                                height={52}
                                className="h-[38px] w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* ── Search bar — DESKTOP (inline, como Burj) ── */}
                        <form
                            onSubmit={handleMobileSearch}
                            className="hidden lg:flex flex-1 items-center gap-2 bg-[#111] border border-white/8 px-4 h-[38px] max-w-[480px]"
                        >
                            <Search className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar produtos, marcas..."
                                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
                            />
                        </form>

                        {/* Ações — direita */}
                        <div className="flex items-center gap-0.5 ml-auto">
                            {/* Conta (desktop) */}
                            <Link
                                href="/conta/pedidos"
                                className="tap-target text-neutral-400 hover:text-white transition-colors hidden lg:flex"
                                aria-label="Minha conta"
                            >
                                <User className="h-5 w-5" />
                            </Link>

                            {/* Carrinho */}
                            <button
                                onClick={toggleCart}
                                className="tap-target text-neutral-400 hover:text-white relative transition-colors"
                                aria-label="Carrinho"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-primary text-white text-[9px] font-black rounded-full shadow-[0_0_10px_rgba(26,143,255,0.5)]">
                                        {totalItems > 9 ? '9+' : totalItems}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Linha 2: search bar MOBILE ── */}
                <div className="lg:hidden border-t border-white/5 px-4 py-2">
                    <form
                        onSubmit={handleMobileSearch}
                        className="flex items-center gap-2 bg-[#111] border border-white/10 px-3 h-[38px]"
                    >
                        <Search className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <input
                            ref={mobileSearchRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar produtos, marcas..."
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="text-neutral-500">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* ── Linha 3: Nav de categorias DESKTOP — CSS group-hover puro (sem dead-zone) ── */}
                <div className="hidden lg:block border-t border-white/5">
                    <div className="container-store">
                        <div className="flex items-center justify-center py-1.5">
                            {CATEGORIAS.map((cat) => (
                                <div key={cat.href} className="relative group">
                                    <Link
                                        href={cat.href}
                                        className="flex items-center gap-0.5 px-4 py-2.5 text-[11px] font-black tracking-[0.18em] uppercase text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                        {cat.label}
                                        {cat.subs.length > 0 && (
                                            <svg className="h-2.5 w-2.5 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 6" fill="none">
                                                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        )}
                                        {/* Underline animado */}
                                        <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                                    </Link>

                                    {/* Dropdown — usa pt-2 para cobrir o gap e evitar dead-zone */}
                                    {cat.subs.length > 0 && (
                                        <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                                            <div className="min-w-[200px] bg-[#0d0d0d] border border-white/10 shadow-2xl py-2">
                                                <Link
                                                    href={cat.href}
                                                    className="block px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 mb-1"
                                                >
                                                    Ver todos — {cat.label}
                                                </Link>
                                                {cat.subs.map((sub, i) => (
                                                    <Link
                                                        key={sub}
                                                        href={cat.subHrefs[i]}
                                                        className="block px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                                                    >
                                                        {sub}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════════
                OVERLAY escuro do drawer mobile
            ══════════════════════════════════════════════════════════════ */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] lg:hidden"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
                DRAWER MOBILE — desliza da esquerda
            ══════════════════════════════════════════════════════════════ */}
            <div
                className={`fixed top-0 left-0 h-full w-[300px] bg-[#0a0a0a] z-[70] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header do drawer */}
                <div className="flex items-center justify-between px-5 h-[56px] border-b border-[#1a1a1a] flex-shrink-0">
                    {mobileLevel ? (
                        <button
                            onClick={() => setMobileLevel(null)}
                            className="flex items-center gap-2 text-white font-bold text-sm"
                        >
                            <ChevronRight className="h-4 w-4 rotate-180 text-primary" />
                            {mobileLevel.label.toUpperCase()}
                        </button>
                    ) : (
                        <Image
                            src="/cc.png"
                            alt="Cola Comigo"
                            width={36}
                            height={36}
                            className="h-9 w-auto object-contain"
                        />
                    )}
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="tap-target text-[#666] hover:text-white"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Conteúdo do drawer (scrollável) */}
                <div className="flex-1 overflow-y-auto py-2">
                    {/* NÍVEL 2: subcategorias */}
                    {mobileLevel ? (
                        <div>
                            <Link
                                href={CATEGORIAS.find(c => c.label === mobileLevel.label)?.href ?? '/categorias'}
                                onClick={() => setDrawerOpen(false)}
                                className="flex items-center justify-between px-5 py-4 text-sm font-black tracking-widest uppercase text-primary border-b border-[#111]"
                            >
                                Ver todos
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                            {mobileLevel.subs.map((sub, i) => (
                                <Link
                                    key={sub}
                                    href={mobileLevel.subHrefs[i]}
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex items-center px-5 py-4 text-sm font-bold uppercase tracking-widest text-[#888] hover:text-white border-b border-[#0f0f0f] transition-colors"
                                >
                                    {sub}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* NÍVEL 1: categorias principais */
                        <>
                            {/* Busca rápida no drawer */}
                            <div className="px-4 py-3 border-b border-[#111]">
                                <form onSubmit={handleMobileSearch} className="flex items-center gap-2 bg-[#111] border border-white/8 px-3 h-[36px]">
                                    <Search className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar..."
                                        className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-700 outline-none"
                                    />
                                </form>
                            </div>

                            <p className="px-5 pt-4 pb-2 text-[9px] font-black text-[#333] uppercase tracking-[0.25em]">
                                Categorias
                            </p>
                            {CATEGORIAS.map((cat) => (
                                cat.subs.length > 0 ? (
                                    <button
                                        key={cat.href}
                                        onClick={() => setMobileLevel(cat)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold uppercase tracking-widest text-[#aaa] hover:text-white border-b border-[#0f0f0f] transition-colors"
                                    >
                                        {cat.label}
                                        <ChevronRight className="h-4 w-4 text-[#333]" />
                                    </button>
                                ) : (
                                    <Link
                                        key={cat.href}
                                        href={cat.href}
                                        onClick={() => setDrawerOpen(false)}
                                        className="flex items-center px-5 py-4 text-sm font-bold uppercase tracking-widest text-[#aaa] hover:text-white border-b border-[#0f0f0f] transition-colors"
                                    >
                                        {cat.label}
                                    </Link>
                                )
                            ))}

                            {/* Institucional */}
                            <p className="px-5 pt-6 pb-2 text-[9px] font-black text-[#333] uppercase tracking-[0.25em]">
                                Institucional
                            </p>
                            {[
                                { label: 'Minha Conta / Pedidos', href: '/conta/pedidos' },
                                { label: 'Pagamento e Frete', href: '/institucional/pagamento-e-frete' },
                                { label: 'Trocas e Devoluções', href: '/institucional/trocas-e-devolucoes' },
                                { label: 'Política de Privacidade', href: '/institucional/politica-de-privacidade' },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex items-center px-5 py-3.5 text-xs font-bold text-[#555] hover:text-white border-b border-[#0f0f0f] transition-colors tracking-wider"
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* WhatsApp */}
                            <a
                                href="https://wa.me/5563991312913"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-5 py-4 mt-2 text-sm font-black text-[#25d366]"
                            >
                                <span className="h-2 w-2 rounded-full bg-[#25d366] animate-pulse" />
                                (63) 99131-2913
                            </a>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
