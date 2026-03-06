'use client'

import { useState, useEffect } from 'react'
import { Filter, SlidersHorizontal, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
    { name: 'Todos', slug: null },
    { name: 'Camisas', slug: 'camisas' },
    { name: 'Calças', slug: 'calcas' },
    { name: "Short's", slug: 'shorts' },
    { name: 'Tênis', slug: 'tenis' },
    { name: 'Bonés', slug: 'bones' },
    { name: 'Casacos', slug: 'casacos' },
    { name: 'Chinelos', slug: 'chinelos' },
    { name: 'Acessórios', slug: 'acessorios' },
]

export function ProdutosPageClient() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [categoria, setCategoria] = useState<string | null>(null)
    const [ordem, setOrdem] = useState<string>('novos')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        setCategoria(params.get('categoria'))
        setOrdem(params.get('ordem') || 'novos')
    }, [])

    useEffect(() => {
        async function load() {
            setLoading(true)
            const supabase = createClient()
            let query = supabase
                .from('products')
                .select(`
                    *,
                    brand:brands(name),
                    images:product_images(url, is_primary),
                    variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active, stock)
                `)
                .eq('is_active', true)

            if (categoria) {
                const { data: cat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', categoria)
                    .single()
                if (cat) query = query.eq('category_id', cat.id)
            }

            if (ordem === 'menor') query = query.order('price', { ascending: true })
            else if (ordem === 'maior') query = query.order('price', { ascending: false })
            else query = query.order('created_at', { ascending: false })

            const { data } = await query
            setProducts(data || [])
            setLoading(false)
        }
        load()
    }, [categoria, ordem])

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
                    <div className="mb-16 pb-8 border-b border-white/10">
                        <h1 className="text-[clamp(3rem,6vw,5rem)] font-black tracking-tighter uppercase leading-none text-white">
                            {categoria
                                ? CATEGORIES.find((c) => c.slug === categoria)?.name ?? 'Produtos'
                                : 'THE COLLECTION'}
                        </h1>
                        <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                            {products.length} RESULTADOS ENCONTRADOS
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-12">
                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-primary" /> CATEGORIAS
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.slug ?? 'todos'}
                                                onClick={() => {
                                                    setCategoria(cat.slug)
                                                    const url = new URL(window.location.href)
                                                    if (cat.slug) url.searchParams.set('categoria', cat.slug)
                                                    else url.searchParams.delete('categoria')
                                                    window.history.pushState({}, '', url)
                                                }}
                                                className={`group flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${categoria === cat.slug || (!categoria && !cat.slug)
                                                    ? 'bg-white text-black pl-6'
                                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {cat.name}
                                                {(categoria === cat.slug || (!categoria && !cat.slug)) && (
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-primary" /> ORDER BY
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { label: 'HYPE (RECÉM CHEGADOS)', value: 'novos' },
                                            { label: 'MAIS ACESSÍVEL', value: 'menor' },
                                            { label: 'PREMIUM', value: 'maior' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setOrdem(opt.value)
                                                    const url = new URL(window.location.href)
                                                    url.searchParams.set('ordem', opt.value)
                                                    window.history.pushState({}, '', url)
                                                }}
                                                className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border border-transparent text-left ${ordem === opt.value
                                                    ? 'border-primary/50 text-primary bg-primary/5'
                                                    : 'text-neutral-500 hover:text-white hover:border-white/10'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                            ) : products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                                    {products.map((p) => (
                                        <ProductCard
                                            key={p.id}
                                            id={p.id}
                                            name={p.name}
                                            slug={p.slug}
                                            price={p.price}
                                            comparePrice={p.compare_price}
                                            imageUrl={p.images?.[0]?.url ?? null}
                                            secondImageUrl={p.images?.[1]?.url ?? null}
                                            brandName={p.brand?.name ?? null}
                                            isNew={p.is_featured ?? false}
                                            variantId={p.variants?.[0]?.id ?? null}
                                            variantSku={p.variants?.[0]?.sku ?? null}
                                            inStock={p.variants?.some((v: any) => (v.stock ?? 0) > 0) ?? false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center border border-white/5 bg-zinc-950">
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Hype Esgotado</h3>
                                    <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-sm">
                                        NENHUM PRODUTO ENCONTRADO.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </>
    )
}
