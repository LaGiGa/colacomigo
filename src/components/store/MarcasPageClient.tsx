'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Loader2 } from '@/components/ui/icons'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const MARCAS_FALLBACK = [
    { name: 'Chronic', slug: 'chronic' },
    { name: 'Supreme', slug: 'supreme' },
    { name: 'Trip Side', slug: 'trip-side' },
    { name: 'Ripndip', slug: 'ripndip' },
    { name: 'Nike', slug: 'nike' },
    { name: 'Adidas', slug: 'adidas' },
    { name: 'Puma', slug: 'puma' },
    { name: 'Trapstar', slug: 'trapstar' },
]

export function MarcasPageClient() {
    const [marcas, setMarcas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data } = await supabase
                .from('brands')
                .select('id, name, slug')
                .order('name')
            setMarcas((data && data.length > 0) ? data : MARCAS_FALLBACK)
            setLoading(false)
        }
        load()
    }, [])

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="border-b border-white/5 py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                    MARCAS
                </h1>
                <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                    {loading ? 'CARREGANDO...' : `${marcas.length} MARCAS DO ACERVO`}
                </p>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="py-24 text-center"><Loader2 className="animate-spin text-primary inline-block h-10 w-10" /></div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {marcas.map((marca) => (
                            <Link
                                key={marca.slug}
                                href={`/marcas/${marca.slug}`}
                                className="group bg-zinc-950 border border-white/8 p-6 flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-zinc-900 transition-all min-h-[110px]"
                            >
                                <span className="text-sm font-black uppercase tracking-tight text-neutral-400 group-hover:text-white transition-colors">
                                    {marca.name}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-neutral-700 mt-2 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
