import { createClient } from '@/lib/supabase/server'

import { createServiceClient } from '@/lib/supabase/server'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('collections').select('slug').eq('is_active', true)
    return (data || []).map(p => ({ slug: p.slug }))
}
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { WhatsAppButton } from '@/components/store/WhatsAppButton'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ ordem?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: colecao } = await supabase
        .from('collections')
        .select('name, description')
        .eq('slug', slug)
        .single()

    if (!colecao) return { title: 'Coleção | Cola Comigo Shop' }
    return {
        title: `${colecao.name} | Cola Comigo Shop`,
        description: colecao.description ?? `Confira a coleção ${colecao.name} na Cola Comigo Shop.`,
    }
}

export default async function ColecaoSlugPage({ params, searchParams }: Props) {
    const { slug } = await params
    const { ordem } = await searchParams

    const supabase = await createClient()

    const { data: colecao } = await supabase
        .from('collections')
        .select('id, name, description')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!colecao) notFound()

    // O fallback de cor/tag para não quebrar o layout existente
    const fallbackCor = 'from-zinc-800/40 to-transparent'
    const tag = colecao.name.toUpperCase()

    let query = supabase
        .from('products')
        .select(`
            *,
            brand:brands(name),
            images:product_images(url, is_primary),
            variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active)
        `)
        .eq('is_active', true)
        .eq('collection_id', colecao.id)

    if (ordem === 'menor') query = query.order('price', { ascending: true })
    else if (ordem === 'maior') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data: products } = await query

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                {/* Hero com gradiente da coleção */}
                <div className="relative border-b border-white/5 py-20 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${fallbackCor}`} />
                    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <Link href="/colecoes" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors mb-6 font-bold uppercase tracking-widest">
                            <ArrowLeft className="h-3 w-3" /> Coleções
                        </Link>
                        <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase text-primary border border-primary/30 px-2 py-1 mb-4">
                            {tag}
                        </span>
                        <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-tighter uppercase leading-none text-white">
                            {colecao.name}
                        </h1>
                        <p className="text-neutral-400 mt-4 max-w-lg">{colecao.description}</p>
                        <p className="text-neutral-600 mt-3 font-bold tracking-widest uppercase text-xs">
                            {products?.length ?? 0} PRODUTO{(products?.length ?? 0) !== 1 ? 'S' : ''}
                        </p>
                    </div>
                </div>

                {/* Produtos */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {products && products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                            {products.map((p) => {
                                const pm = p as any
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
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center border border-white/5 bg-zinc-950">
                            <div className="text-6xl mb-6 opacity-50">🥶</div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Em Breve</h3>
                            <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-sm mb-8">
                                Produtos desta coleção em breve. Aguarde o drop!
                            </p>
                            <Button className="bg-primary text-white font-bold hover:bg-primary/90" asChild>
                                <Link href="/produtos">Ver Todos os Produtos</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <WhatsAppButton />
            <CartDrawer />
        </>
    )
}
