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
import { AnnouncementBar } from '@/components/store/StoreDynamicComponents'
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
    const [dbBrands, setDbBrands] = useState<any[]>([])
    const [dbCollections, setDbCollections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const supabase = createClient()

            // 1. Carregar Categorias para a Sidebar
            const [
                { data: catData },
                { data: brandData },
                { data: colData }
            ] = await Promise.all([
                supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
                supabase.from('brands').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
                supabase.from('collections').select('id, name, slug').eq('is_active', true).order('sort_order', { ascending: true })
            ])
            if (catData) setDbCategories(catData as Category[])
            if (brandData) setDbBrands(brandData)
            if (colData) setDbCollections(colData)

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
            <AnnouncementBar />
            <Header />
            <main className="flex-1 bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Imagens do Produto (Hype layout: larger images) */}
                        <div className="lg:col-span-7 w-full">
                            <ImageGallery
                                images={product.images || []}
                                productName={product.name}
                            />
                        </div>

                        {/* Detalhes do Produto */}
                        <div className="lg:col-span-5 flex flex-col gap-8 w-full sticky top-24">
                            <div className="space-y-4">
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
                                    <h3 className="text-[11px] font-black tracking-widest uppercase mb-4 text-neutral-400">Descrição Detalhada</h3>
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
            </main>
            <Footer />
            <CartDrawer />
        </div>
    )
}
