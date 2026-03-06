import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { WhatsAppButton } from '@/components/store/WhatsAppButton'

import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Coleções | Cola Comigo Shop',
    description: 'Explore as coleções exclusivas da Cola Comigo Shop: Streetwear, Nova Coleção e muito mais.',
}

const CORES = [
    'from-blue-900/50 via-zinc-900 to-zinc-950',
    'from-zinc-800/60 via-zinc-900 to-zinc-950',
    'from-orange-900/50 via-zinc-900 to-zinc-950',
    'from-emerald-900/40 via-zinc-900 to-zinc-950',
]

export default async function ColecoesPage() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('collections')
        .select('name, slug, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    const colecoes = (data ?? []).map((c, i) => ({
        nome: c.name,
        slug: c.slug,
        descricao: c.description ?? 'Explore essa coleção exclusiva da Cola Comigo.',
        cor: CORES[i % CORES.length],
        tag: c.slug.replace(/-/g, ' ').toUpperCase(),
    }))

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                {/* Hero */}
                <div className="border-b border-white/5 py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                    <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                        COLEÇÕES
                    </h1>
                    <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                        {colecoes.length} COLEÇÕES EXCLUSIVAS
                    </p>
                </div>

                {/* Grid de Coleções */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {colecoes.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {colecoes.map((col) => (
                                <Link
                                    key={col.slug}
                                    href={`/colecoes/${col.slug}`}
                                    className="group relative bg-zinc-900 border border-white/8 rounded-2xl p-10 overflow-hidden transition-all duration-300 hover:border-primary/30 min-h-[280px] flex flex-col justify-end"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${col.cor} rounded-2xl`} />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    <div className="relative">
                                        <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase border border-primary/30 text-primary/80 px-2 py-1 mb-4">
                                            {col.tag}
                                        </span>
                                        <h2 className="text-4xl font-black tracking-tight uppercase mb-3 text-white">{col.nome}</h2>
                                        <p className="text-sm text-neutral-400 mb-5 max-w-sm">{col.descricao}</p>
                                        <span className="flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all">
                                            Ver coleção <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center text-neutral-600">
                            <p className="text-2xl font-black uppercase">Coleções em breve</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    )
}
