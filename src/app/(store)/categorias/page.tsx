export const runtime = 'edge'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from '@/components/ui/icons'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 120

export const metadata: Metadata = {
    title: 'Categorias | Cola Comigo Shop',
    description: 'Explore todas as categorias ativas da Cola Comigo Shop.',
}

export default async function CategoriasPage() {
    const supabase = await createClient()
    const { data: categoriasDB, error } = await supabase
        .from('categories')
        .select('name, slug, description, image_url')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('CategoriasPage [Error]:', error)
    }

    const categorias = (categoriasDB ?? []).map((cat, index) => ({
        nome: cat.name,
        slug: cat.slug,
        descricao: cat.description ?? 'Explore os lançamentos desta categoria.',
        img: cat.image_url || '/cat-placeholder.svg',
        num: String(index + 1).padStart(2, '0'),
    }))

    return (
        <main className="min-h-screen bg-black">
            <div className="border-b border-white/5 py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                    CATEGORIAS
                </h1>
                <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                    {categorias.length} DEPARTAMENTOS
                </p>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categorias.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/categorias/${cat.slug}`}
                            className="group relative border border-white/[0.08] overflow-hidden bg-black min-h-[260px]"
                        >
                            <Image
                                src={cat.img}
                                alt={cat.nome}
                                fill
                                className="object-cover object-center opacity-45 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
                            <ArrowRight className="absolute top-5 right-5 h-5 w-5 text-neutral-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-20" />

                            <div className="relative z-10 p-5 flex flex-col h-full">
                                <span className="text-[10px] font-black tracking-widest text-primary mb-2">{cat.num}</span>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white">{cat.nome}</h2>
                                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{cat.descricao}</p>
                                <p className="text-[10px] font-black tracking-widest uppercase text-neutral-400 mt-auto pt-4">
                                    EXPLORAR DROP
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
