import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { WhatsAppButton } from '@/components/store/WhatsAppButton'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Filter, SlidersHorizontal, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

    const { data: categoria } = await supabase
        .from('categories')
        .select('name')
        .eq('slug', slug)
        .single()

    if (!categoria) return { title: 'Categoria | Cola Comigo Shop' }
    return {
        title: `${categoria.name} | Cola Comigo Shop`,
        description: `Compre ${categoria.name} autênticas na Cola Comigo Shop. As melhores marcas de streetwear.`,
    }
}

export default async function CategoriaSlugPage({ params, searchParams }: Props) {
    const { slug } = await params
    const { ordem } = await searchParams

    const supabase = await createClient()

    // Busca a categoria selecionada
    const { data: categoria } = await supabase
        .from('categories')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!categoria) notFound()

    // Busca todas as categorias ativas para o sidebar
    const { data: allCategories } = await supabase
        .from('categories')
        .select('name, slug')
        .order('name', { ascending: true })

    const listCategories = allCategories ?? []

    let query = supabase
        .from('products')
        .select(`
            *,
            brand:brands(name),
            images:product_images(url, is_primary),
            variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active)
        `)
        .eq('is_active', true)
        .eq('category_id', categoria.id)

    if (ordem === 'menor') query = query.order('price', { ascending: true })
    else if (ordem === 'maior') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data: products } = await query

    const ORDENACOES = [
        { label: 'Recém Chegados', value: 'novos' },
        { label: 'Menor Preço', value: 'menor' },
        { label: 'Maior Preço', value: 'maior' },
    ]

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

                    {/* Breadcrumb */}
                    <Link href="/categorias" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors mb-8 font-bold uppercase tracking-widest">
                        <ArrowLeft className="h-3 w-3" /> Categorias
                    </Link>

                    {/* Header */}
                    <div className="mb-14 pb-8 border-b border-white/8">
                        <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                            {categoria.name}
                        </h1>
                        <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                            {products?.length ?? 0} PRODUTO{(products?.length ?? 0) !== 1 ? 'S' : ''} ENCONTRADO{(products?.length ?? 0) !== 1 ? 'S' : ''}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar */}
                        <aside className="lg:w-56 flex-shrink-0">
                            <div className="sticky top-24 space-y-10">
                                {/* Todas categorias */}
                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5 text-primary" /> Departamentos
                                    </h2>
                                    <div className="flex flex-col gap-0.5">
                                        {listCategories.map((cat) => (
                                            <Link
                                                key={cat.slug}
                                                href={`/categorias/${cat.slug}`}
                                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${slug === cat.slug
                                                    ? 'bg-white text-black'
                                                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Ordenação */}
                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Ordenar por
                                    </h2>
                                    <div className="flex flex-col gap-0.5">
                                        {ORDENACOES.map((opt) => (
                                            <Link
                                                key={opt.value}
                                                href={`/categorias/${slug}?ordem=${opt.value}`}
                                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border border-transparent ${ordem === opt.value
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

                        {/* Grid de produtos */}
                        <div className="flex-1">
                            {products && products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
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
                                    <div className="text-6xl mb-6 opacity-50 grayscale hover:grayscale-0 transition-all">🥶</div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Hype Esgotado</h3>
                                    <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-sm mb-8">
                                        Nenhum produto nessa categoria ainda. Em breve novidades!
                                    </p>
                                    <Button className="bg-primary text-white font-bold hover:bg-primary/90" asChild>
                                        <Link href="/produtos">Ver Todos os Produtos</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <WhatsAppButton />
            <CartDrawer />
        </>
    )
}
