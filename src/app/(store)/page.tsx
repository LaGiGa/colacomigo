export const runtime = 'edge';
import Link from 'next/link'
import Image from 'next/image'


import { ArrowRight, Zap, Shield, Truck } from 'lucide-react'
import { HeroCarousel } from '@/components/store/HeroCarousel'
import { Header } from '@/components/store/Header'
import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { RecentPurchasePopup } from '@/components/store/RecentPurchasePopup'
import { Footer } from '@/components/store/Footer'
import { WhatsAppButton } from '@/components/store/WhatsAppButton'
import { TestimonialsSection } from '@/components/store/TestimonialsSection'
import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Cola Comigo Shop | Streetwear e Edições Limitadas em Palmas-TO',
    description: 'A maior curadoria de streetwear de Palmas-TO. Drops limitados, bonés, camisas e sneakers das melhores marcas. Atendimento ultra-rápido via WhatsApp!',
}

// ─── Dados ────────────────────────────────────────────────────────────────────
const CATEGORIAS = [
    { nome: 'Camisas', slug: 'camisas', desc: 'Grife & Streetwear', num: '01', img: '/cat-camisas.png' },
    { nome: 'Calças', slug: 'calcas', desc: 'Baggy, Cargo & Jogger', num: '02', img: '/cat-calcas.png' },
    { nome: 'Tênis', slug: 'tenis', desc: 'Sneakers & Klassics', num: '03', img: '/cat-tenis.png' },
    { nome: 'Bonés', slug: 'bones', desc: 'Caps & Headwear', num: '04', img: '/cat-bones.png' },
    { nome: 'Bags', slug: 'bags', desc: 'Mochilas & Pochetes', num: '05', img: '/cat-bags.png' },
    { nome: 'Casacos', slug: 'casacos', desc: 'Moletons & Jaquetas', num: '06', img: '/cat-casacos.png' },
    { nome: "Short's", slug: 'shorts', desc: 'Bermudas Premium', num: '07', img: '/cat-shorts.png' },
    { nome: 'Chinelos', slug: 'chinelos', desc: 'Slides & Sandálias', num: '08', img: '/cat-chinelos.png' },
]

// Marcas e coleções vêm do Supabase (ver PaginaInicial async)

const DIFERENCIAIS = [
    {
        icon: Truck,
        titulo: 'Entrega Relâmpago',
        descricao: 'Em Palmas-TO você recebe seu drop no mesmo dia. Rapidez que só a Cola tem.',
    },
    {
        icon: Zap,
        titulo: 'Atendimento no Zap',
        descricao: 'Sem robôs. Suporte humano e ultra-rápido para você tirar suas dúvidas direto com a gente.',
    },
    {
        icon: Shield,
        titulo: 'Edições Limitadas',
        descricao: 'Curadoria exclusiva de peças que acabaram de dropar. O hype está aqui.',
    },
]

// ─── Página ───────────────────────────────────────────────────────────────────
export default async function PaginaInicial() {
    const supabase = createServiceClient()

    // Buscar banners do banco (ativos, ordenados)
    const { data: bannersDB } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    // Buscar marcas do banco (ativas, ordenadas)
    const { data: marcasDB } = await supabase
        .from('brands')
        .select('name, slug, logo_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6)

    // Buscar coleções do banco (ativas, ordenadas)
    const { data: colecoesDB } = await supabase
        .from('collections')
        .select('name, slug, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(4)

    const MARCAS = (marcasDB ?? []).map(m => ({ nome: m.name, slug: m.slug, logo: m.logo_url }))
    const COLECOES = (colecoesDB ?? []).map((c, i) => ({
        nome: c.name,
        slug: c.slug,
        descricao: c.description ?? 'Explore essa coleção exclusiva.',
        cor: i % 2 === 0 ? 'from-blue-900/40 to-zinc-900' : 'from-zinc-800/60 to-zinc-900',
        destaque: c.slug.replace(/-/g, ' ').toUpperCase(),
    }))
    return (
        <div className="min-h-screen bg-black">
            <AnnouncementBar />
            <Header />
            <RecentPurchasePopup />

            {/* ─── HERO CAROUSEL ─────────────────────────────────────── */}
            <HeroCarousel initialBanners={bannersDB ?? []} />

            {/* ═══════════════════════════════════════════════════════════
                CATEGORIAS — Brutalist Tile
                Grid 4×2 com inversão azul no hover, número gigante no fundo
            ═══════════════════════════════════════════════════════════ */}
            <section className="border-t border-white/5">

                {/* Cabeçalho */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase block mb-3">
                                O Corre Começa Aqui
                            </span>
                            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tighter uppercase leading-none text-white">
                                CATEGORIAS
                            </h2>
                        </div>
                        <Link
                            href="/categorias"
                            className="hidden sm:flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors group pb-2"
                        >
                            Ver todas
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Grid Brutalist com fotos editoriais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/[0.08]">
                    {CATEGORIAS.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/categorias/${cat.slug}`}
                            className="group relative border-r border-b border-white/[0.08] overflow-hidden bg-black"
                            style={{ minHeight: '230px' }}
                        >
                            {/* ── Foto editorial de fundo ── */}
                            <Image
                                src={cat.img}
                                alt={cat.nome}
                                fill
                                className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-500 ease-out"
                                sizes="(max-width: 640px) 50vw, 25vw"
                            />

                            {/* ── Overlay dark que abre no hover (revela foto) ── */}
                            <div className="absolute inset-0 bg-black/75 group-hover:bg-black/40 transition-colors duration-500" />

                            {/* ── Toque de azul no hover — slide-up sutil ── */}
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                            {/* ── Linha lateral azul ── */}
                            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

                            {/* ── Número gigante semitransparente ── */}
                            <span
                                aria-hidden
                                className="absolute -bottom-4 -right-1 font-black leading-none select-none pointer-events-none text-[90px] sm:text-[110px] text-white/[0.06] group-hover:text-white/[0.12] transition-colors duration-500"
                            >
                                {cat.num}
                            </span>

                            {/* ── Conteúdo ── */}
                            <div
                                className="relative z-10 p-5 sm:p-6 flex flex-col justify-between"
                                style={{ minHeight: '230px' }}
                            >
                                {/* Topo */}
                                <div className="flex items-start justify-between">
                                    <span className="text-[9px] font-black tracking-[0.35em] text-white/30 group-hover:text-white/60 uppercase transition-colors duration-300">
                                        {cat.num}
                                    </span>
                                    <span className="h-4 w-4 text-white/0 group-hover:text-white opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 8h10M9 4l4 4-4 4" />
                                        </svg>
                                    </span>
                                </div>

                                {/* Base */}
                                <div>
                                    <span className="text-[9px] font-bold tracking-[0.2em] text-white/40 group-hover:text-primary uppercase block mb-2 transition-colors duration-300">
                                        {cat.desc}
                                    </span>
                                    <h3
                                        className="font-black uppercase tracking-tight leading-none text-white group-hover:text-white transition-colors duration-300"
                                        style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.7rem)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                                    >
                                        {cat.nome}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Ver todas — apenas no mobile */}
                <div className="sm:hidden border-t border-white/[0.08]">
                    <Link
                        href="/categorias"
                        className="flex items-center justify-center gap-2 py-4 text-[10px] font-black tracking-[0.3em] uppercase text-neutral-500 hover:text-white transition-colors"
                    >
                        Ver todas as categorias <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </section>

            {/* ─── COLEÇÕES ───────────────────────────────────────────── */}
            <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-baseline justify-between mb-8 gap-4">
                    <h2 className="text-2xl font-black tracking-tight uppercase">Coleções</h2>
                    <Link href="/colecoes" className="text-sm font-bold text-primary hover:text-white transition-colors flex items-center gap-1">
                        Ver todas <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {COLECOES.map((col) => (
                        <Link
                            key={col.slug}
                            href={`/colecoes/${col.slug}`}
                            className="group relative bg-zinc-900 border border-white/8 rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:border-primary/30"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${col.cor} rounded-2xl`} />
                            <div className="relative">
                                <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase text-primary/80 mb-3 border border-primary/30 px-2 py-1">
                                    {col.destaque}
                                </span>
                                <h3 className="text-3xl font-black tracking-tight uppercase mb-2">{col.nome}</h3>
                                <p className="text-sm text-neutral-400 mb-4">{col.descricao}</p>
                                <span className="flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all">
                                    Ver coleção <ArrowRight className="h-4 w-4" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ─── TESTIMONIALS (PROVA SOCIAL) ────────────────────────────────── */}
            <TestimonialsSection />

            {/* ─── MARCAS (ESTILO PREMIUM / LOGOS) ────────────────────────────────── */}
            <section className="py-24 border-t border-white/[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                        <div>
                            <span className="text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-2 block">Curadoria de Peso</span>
                            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">AS MARCAS QUE <span className="text-primary">DOMINAM</span> O HYPE</h2>
                        </div>
                        <Link href="/marcas" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                            Explorar Universo <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10 border border-white/10 overflow-hidden rounded-2xl shadow-2xl">
                        {MARCAS.map((marca) => (
                            <Link
                                key={marca.slug}
                                href={`/marcas/${marca.slug}`}
                                className="bg-zinc-950 flex flex-col items-center justify-center p-8 group relative hover:z-10 transition-all duration-500 min-h-[160px]"
                            >
                                {/* Efeito de brilho no hover */}
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.05] transition-colors" />

                                {/* Gradiente sutil interno para dar profundidade */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                                <div className="relative w-full aspect-[3/2] flex items-center justify-center grayscale-[60%] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105">
                                    {marca.logo ? (
                                        <Image
                                            src={marca.logo}
                                            alt={marca.nome}
                                            fill
                                            className="object-contain p-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                        />
                                    ) : (
                                        <span className="text-xl font-black tracking-tighter text-white opacity-40 group-hover:opacity-100 uppercase transition-all group-hover:tracking-widest">
                                            {marca.nome}
                                        </span>
                                    )}
                                </div>
                                <span className="absolute bottom-4 text-[9px] font-black uppercase tracking-[0.3em] text-primary/0 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 duration-500">
                                    Ver Marca
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── DIFERENCIAIS ───────────────────────────────────────── */}
            <section className="py-16 border-t border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {DIFERENCIAIS.map(({ icon: Icon, titulo, descricao }) => (
                            <div key={titulo} className="flex gap-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[#1a8fff] to-[#0055cc] flex items-center justify-center">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{titulo}</h3>
                                    <p className="mt-1 text-sm text-neutral-400">{descricao}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
