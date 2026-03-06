'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { ImageGallery } from '@/components/store/ImageGallery'
import { ProductActions } from '@/components/store/ProductActions'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronRight, Filter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
    id: string
    name: string
    slug: string
    parent_id: string | null
}

export function ProductPageClient({ slug }: { slug: string }) {
    const [product, setProduct] = useState<any>(null)
    const [dbCategories, setDbCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const supabase = createClient()

            // 1. Carregar Categorias para a Sidebar
            const { data: catData } = await supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true })
            if (catData) setDbCategories(catData)

            // 2. Carregar o Produto
            const { data: prodData } = await supabase
                .from('products')
                .select(`
                    *,
                    images:product_images(url, is_primary, position),
                    brand:brands(name, logo_url),
                    category:categories(id, name, slug),
                    variants:product_variants(*)
                `)
                .eq('slug', slug)
                .eq('is_active', true)
                .single()

            if (prodData) setProduct(prodData)
            setLoading(false)
        }
        load()
    }, [slug])

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 animate-pulse">CARREGANDO DROP...</p>
        </div>
    )

    if (!product) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">DROP NÃO ENCONTRADO</h1>
            <p className="text-neutral-500 mb-8 uppercase text-xs font-bold tracking-widest">O produto que você procura pode ter esgotado ou mudado de link.</p>
            <Link href="/produtos" className="btn-primary px-8">VER OUTROS DROPS</Link>
        </div>
    )

    const primaryImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Sidebar (Mesma consistência das outras páginas) */}
                        <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
                            <div className="sticky top-24 space-y-12">
                                <div>
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-primary" /> EXPLORE O DROP
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            href="/produtos"
                                            className="group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            TODOS OS PRODUTOS
                                        </Link>

                                        {dbCategories.filter(c => !c.parent_id).map((cat) => (
                                            <div key={cat.id} className="mt-1">
                                                <Link
                                                    href={`/categorias/${cat.slug}`}
                                                    className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${product.category?.id === cat.id || dbCategories.find(c => c.id === product.category?.id)?.parent_id === cat.id
                                                        ? 'bg-zinc-800 text-white border-l-2 border-primary'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l border-white/5'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </Link>

                                                {/* Subcategorias se esta for a categoria pai do produto */}
                                                {(product.category?.id === cat.id || dbCategories.find(c => c.id === product.category?.id)?.parent_id === cat.id) && (
                                                    <div className="ml-4 border-l border-white/10 flex flex-col py-2 gap-1">
                                                        {dbCategories.filter(sub => sub.parent_id === cat.id).map(sub => (
                                                            <Link
                                                                key={sub.id}
                                                                href={`/categorias/${sub.slug}`}
                                                                className={`group flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${product.category?.id === sub.id
                                                                    ? 'text-primary'
                                                                    : 'text-neutral-600 hover:text-neutral-300'
                                                                    }`}
                                                            >
                                                                <ChevronRight className={`w-3 h-3 ${product.category?.id === sub.id ? 'translate-x-1' : ''} transition-transform`} />
                                                                {sub.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Detalhes do Produto */}
                        <div className="flex-1">
                            <div className="grid lg:grid-cols-2 gap-12">
                                <ImageGallery
                                    images={product.images || []}
                                    productName={product.name}
                                />

                                <div className="space-y-8">
                                    <div>
                                        {product.is_new && (
                                            <Badge className="bg-primary hover:bg-primary/90 text-white font-bold mb-4">
                                                NOVIDADE
                                            </Badge>
                                        )}
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight text-white mb-2">
                                            {product.name}
                                        </h1>
                                        {product.category && (
                                            <Link href={`/categorias/${product.category.slug}`} className="text-xs font-black text-primary tracking-[0.3em] uppercase hover:underline">
                                                {product.category.name}
                                            </Link>
                                        )}
                                    </div>

                                    <ProductActions
                                        productId={product.id}
                                        productName={product.name}
                                        productSlug={product.slug}
                                        basePrice={product.price}
                                        comparePrice={product.compare_price}
                                        imageUrl={primaryImage}
                                        variants={product.variants || []}
                                        description={product.description}
                                    />

                                    <div className="pt-8 border-t border-white/10 space-y-6">
                                        <div>
                                            <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-neutral-400">Descrição Detalhada</h3>
                                            <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed font-medium">
                                                {product.description}
                                            </div>
                                        </div>

                                        {product.brand && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                                {product.brand.logo_url && (
                                                    <div className="h-12 w-12 relative rounded-lg overflow-hidden bg-white/10">
                                                        <Image src={product.brand.logo_url} alt={product.brand.name} fill className="object-contain p-2" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Autoridade</p>
                                                    <p className="font-bold text-lg text-white">{product.brand.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    )
}
