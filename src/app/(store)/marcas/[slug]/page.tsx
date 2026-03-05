import { createClient } from '@/lib/supabase/server'
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

    const { data: marca } = await supabase
        .from('brands')
        .select('name')
        .eq('slug', slug)
        .single()

    if (!marca) return { title: 'Marca | Cola Comigo Shop' }
    return {
        title: `${marca.name} | Cola Comigo Shop`,
        description: `Compre produtos da marca ${marca.name} na Cola Comigo Shop.`,
    }
}

export default async function MarcaSlugPage({ params, searchParams }: Props) {
    const { slug } = await params
    const { ordem } = await searchParams

    const supabase = await createClient()

    const { data: marca } = await supabase
        .from('brands')
        .select('id, name')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!marca) notFound()

    let query = supabase
        .from('products')
        .select(`
            *,
            brand:brands(name),
            images:product_images(url, is_primary),
            variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active)
        `)
        .eq('is_active', true)
        .eq('brand_id', marca.id)

    if (ordem === 'menor') query = query.order('price', { ascending: true })
    else if (ordem === 'maior') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data: products } = await query

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                {/* Hero */}
                <div className="border-b border-white/5 py-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/marcas" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors mb-6 font-bold uppercase tracking-widest">
                        <ArrowLeft className="h-3 w-3" /> Marcas
                    </Link>
                    <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                        {marca.name}
                    </h1>
                    <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                        {products?.length ?? 0} PRODUTO{(products?.length ?? 0) !== 1 ? 'S' : ''} DA MARCA
                    </p>
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
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Nada ainda</h3>
                            <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-sm mb-8">
                                Ainda sem produtos desta marca. Em breve!
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
