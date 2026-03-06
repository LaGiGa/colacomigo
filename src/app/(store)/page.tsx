import Link from 'next/link'
import Image from 'next/image'

import { ArrowRight, Zap, Shield, Truck } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import {
    HeroCarousel,
    AnnouncementBar,
    RecentPurchasePopup,
    TestimonialsSection
} from '@/components/store/StoreDynamicComponents'
import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Cola Comigo Shop | Streetwear e Edições Limitadas em Palmas-TO',
    description: 'A maior curadoria de streetwear de Palmas-TO. Drops limitados, bonés, camisas e sneakers das melhores marcas. Atendimento ultra-rápido via WhatsApp!',
}

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

const DIFERENCIAIS = [
    { icon: Truck, titulo: 'Entrega Relâmpago', descricao: 'Em Palmas-TO você recebe seu drop no mesmo dia.' },
    { icon: Zap, titulo: 'Atendimento no Zap', descricao: 'Sem robôs. Suporte humano e ultra-rápido.' },
    { icon: Shield, titulo: 'Edições Limitadas', descricao: 'Curadoria exclusiva de peças que acabaram de dropar.' },
]

export default async function PaginaInicial() {
    const supabase = createServiceClient()
    const { data: bannersDB } = await supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })

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

    // Buscar categorias do banco
    const { data: categoriasDB } = await supabase
        .from('categories')
        .select('name, slug, image_url')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order', { ascending: true })
        .limit(8)

    const MARCAS = (marcasDB ?? []).map(m => ({ nome: m.name, slug: m.slug, logo: m.logo_url }))
    const COLECOES = (colecoesDB ?? []).map((c, i) => ({
        nome: c.name,
        slug: c.slug,
        descricao: c.description ?? 'Explore essa coleção exclusiva da Cola Comigo.',
        cor: i % 2 === 0 ? 'from-blue-900/40 text-blue-900' : 'from-zinc-800/60 text-zinc-800', // Adjusted for contrast
        destaque: c.slug.replace(/-/g, ' ').toUpperCase(),
    }))
    const CATEGORIAS_LIST = (categoriasDB ?? []).map((c, i) => ({
        nome: c.name,
        slug: c.slug,
        img: c.image_url || `/cat-placeholder.png`,
        num: (i + 1).toString().padStart(2, '0')
    }))


    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <AnnouncementBar />
            <Header />
            <RecentPurchasePopup />

            <section className="relative overflow-hidden">
                <HeroCarousel initialBanners={bannersDB || []} />
            </section>

            {/* Categorias */}
            <section className="py-20 bg-black relative">
                <div className="container-store">
                    <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-2 block animate-in fade-in slide-in-from-bottom-2 duration-700">Explorar por Estilo</span>
                            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tighter uppercase leading-none text-white">CATEGORIAS</h2>
                        </div>
                        <Link href="/categorias" className="hidden sm:flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors group pb-2">
                            Ver todas <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/[0.08]">
                    {CATEGORIAS_LIST.map((cat) => (
                        <Link key={cat.slug} href={`/categorias/${cat.slug}`} className="group relative border-r border-b border-white/[0.08] overflow-hidden bg-black" style={{ minHeight: '300px' }}>
                            {cat.img && <Image src={cat.img} alt={cat.nome} fill className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out opacity-60 group-hover:opacity-100" sizes="(max-width: 640px) 50vw, 25vw" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent group-hover:from-black/80 transition-all duration-500" />
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            <div className="absolute top-8 left-8 z-10">
                                <span className="text-[10px] font-black tracking-widest text-primary block mb-1">{cat.num}</span>
                                <h3 className="text-2xl font-black tracking-tighter uppercase group-hover:text-white transition-colors">{cat.nome}</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">EXPLORAR DROP</p>
                            </div>
                        </Link>
                    ))}
                </div>

            </section>

            {/* Coleções */}
            {COLECOES.length > 0 && (
                <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-baseline justify-between mb-10 gap-4">
                        <div>
                            <span className="text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-2 block">Drops Exclusivos</span>
                            <h2 className="text-4xl font-black tracking-tight uppercase leading-none">Coleções</h2>
                        </div>
                        <Link href="/colecoes" className="text-xs font-black tracking-widest uppercase text-primary hover:text-white transition-colors flex items-center gap-2 group">
                            Ver tudo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {COLECOES.map((col) => (
                            <Link
                                key={col.slug}
                                href={`/colecoes/${col.slug}`}
                                className="group relative bg-zinc-900 border border-white/8 rounded-2xl p-10 overflow-hidden transition-all duration-300 hover:border-primary/30 min-h-[280px] flex flex-col justify-end"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${col.cor} rounded-2xl`} />
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                <div className="relative">
                                    <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase border border-primary/30 text-primary/80 px-2 py-1 mb-4">
                                        {col.destaque}
                                    </span>
                                    <h3 className="text-4xl font-black tracking-tight uppercase mb-3 text-white">{col.nome}</h3>
                                    <p className="text-sm text-neutral-400 mb-5 max-w-sm">{col.descricao}</p>
                                    <span className="flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all">
                                        Ver coleção <ArrowRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <TestimonialsSection />

            {/* Marcas */}
            {MARCAS.length > 0 && (
                <section className="py-24 border-t border-white/[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
                    <div className="container-store">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
                            <div>
                                <span className="text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-2 block">Curadoria de Peso</span>
                                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-tighter uppercase leading-none text-white overflow-hidden">
                                    AS MARCAS QUE <span className="text-primary italic">DOMINAM</span> O HYPE
                                </h2>
                            </div>
                            <Link href="/marcas" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors border-b border-white/10 pb-2">
                                Explorar Universo <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10 border border-white/10 overflow-hidden rounded-2xl shadow-2xl">
                            {MARCAS.map((marca) => (
                                <Link
                                    key={marca.slug}
                                    href={`/marcas/${marca.slug}`}
                                    className="group relative bg-black aspect-square flex items-center justify-center grayscale-[100%] hover:grayscale-0 transition-all duration-700 border-r border-b border-white/5"
                                >
                                    <div className="absolute inset-0 bg-zinc-950 group-hover:bg-primary/10 transition-colors duration-500" />
                                    {marca.logo ? (
                                        <div className="relative w-2/3 h-1/3 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                                            <Image src={marca.logo} alt={marca.nome} fill className="object-contain" />
                                        </div>
                                    ) : (
                                        <span className="text-xl font-black text-white/10 group-hover:text-white transition-all duration-500 uppercase tracking-widest">
                                            {marca.nome}
                                        </span>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                </Link>

                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Diferenciais */}
            <section className="py-24 bg-[#080808] border-y border-white/[0.05]">
                <div className="container-store">
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
        </div>
    )
}
