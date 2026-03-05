import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Todos os Produtos | Cola Comigo Shop',
    description: 'Camisas, Tênis, Bonés, Casacos e muito mais. Streetwear de qualidade.',
}

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

interface Props {
    searchParams: Promise<{ categoria?: string; ordem?: string }>
}

export default async function ProdutosPage({ searchParams }: Props) {
    const { categoria, ordem } = await searchParams
    const supabase = await createClient()

    let query = supabase
        .from('products')
        .select(`
      *,
      brand:brands(name),
      images:product_images(url, is_primary),
      variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active, stock)
    `)
        .eq('is_active', true)

    // Filtro por categoria
    if (categoria) {
        const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoria)
            .single()
        if (cat) query = query.eq('category_id', cat.id)
    }

    // Ordenação
    if (ordem === 'menor') query = query.order('price', { ascending: true })
    else if (ordem === 'maior') query = query.order('price', { ascending: false })
    else if (ordem === 'novos') query = query.order('created_at', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data: products } = await query

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
                    {/* Header da página - Extreme Typography */}
                    <div className="mb-16 pb-8 border-b border-white/10">
                        <h1 className="text-[clamp(3rem,6vw,5rem)] font-black tracking-tighter uppercase leading-none text-white">
                            {categoria
                                ? CATEGORIES.find((c) => c.slug === categoria)?.name ?? 'Produtos'
                                : 'THE COLLECTION'}
                        </h1>
                        <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                            {products?.length ?? 0} RESULTADO{(products?.length ?? 0) !== 1 ? 'S' : ''} ENCONTRADO{(products?.length ?? 0) !== 1 ? 'S' : ''}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar de Categorias Brutalista */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-12">
                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-primary" /> CATEGORIAS
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        {CATEGORIES.map((cat) => (
                                            <Link
                                                key={cat.slug ?? 'todos'}
                                                href={cat.slug ? `/produtos?categoria=${cat.slug}` : '/produtos'}
                                                className={`group flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${categoria === cat.slug || (!categoria && !cat.slug)
                                                    ? 'bg-white text-black pl-6'
                                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {cat.name}
                                                {(categoria === cat.slug || (!categoria && !cat.slug)) && (
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                )}
                                            </Link>
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
                                            <Link
                                                key={opt.value}
                                                href={`/produtos${categoria ? `?categoria=${categoria}&` : '?'}ordem=${opt.value}`}
                                                className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border border-transparent ${ordem === opt.value
                                                    ? 'border-primary/50 text-primary bg-primary/5'
                                                    : 'text-neutral-500 hover:text-white hover:border-white/10'
                                                    }`}
                                            >
                                                {opt.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Grid de Produtos - Sharp */}
                        <div className="flex-1">
                            {products && products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                                    {products.map((p) => {
                                        const pm = p as any;
                                        return (
                                            <ProductCard
                                                key={pm.id}
                                                id={pm.id}
                                                name={pm.name}
                                                slug={pm.slug}
                                                price={pm.price}
                                                comparePrice={pm.compare_price}
                                                imageUrl={pm.images?.[0]?.url ?? null}
                                                secondImageUrl={pm.images?.[1]?.url ?? null}
                                                brandName={pm.brand?.name ?? null}
                                                isNew={pm.is_featured ?? false}
                                                variantId={pm.variants?.[0]?.id ?? null}
                                                variantSku={pm.variants?.[0]?.sku ?? null}
                                                inStock={pm.variants?.some((v: any) => (v.stock ?? 0) > 0) ?? false}
                                            />
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center border border-white/5 bg-zinc-950">
                                    <div className="text-6xl mb-6 opacity-50 grayscale hover:grayscale-0 transition-all">🥶</div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Hype Esgotado</h3>
                                    <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-sm">
                                        NENHUM PRODUTO ENCONTRADO NESSA CATEGORIA. O DROP DEVE TER ESGOTADO RÁPIDO.
                                    </p>
                                    {categoria && (
                                        <Button className="btn-primary mt-8" asChild>
                                            <Link href="/produtos">VER TODOS OS DROPS</Link>
                                        </Button>
                                    )}
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
