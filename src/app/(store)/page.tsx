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
    const { data: bannersDB } = await supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order')

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
                    {CATEGORIAS.map((cat) => (
                        <Link key={cat.slug} href={`/categorias/${cat.slug}`} className="group relative border-r border-b border-white/[0.08] overflow-hidden bg-black" style={{ minHeight: '230px' }}>
                            <Image src={cat.img} alt={cat.nome} fill className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-500 ease-out" sizes="(max-width: 640px) 50vw, 25vw" />
                            <div className="absolute inset-0 bg-black/75 group-hover:bg-black/40 transition-colors duration-500" />
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            <div className="absolute top-8 left-8">
                                <span className="text-[10px] font-black tracking-widest text-white/40 block mb-1">{cat.num}</span>
                                <h3 className="text-xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">{cat.nome}</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-500">{cat.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <TestimonialsSection />

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
