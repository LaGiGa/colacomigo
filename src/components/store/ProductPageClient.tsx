'use client'

import { useState, useEffect } from 'react'
import { ImageGallery } from '@/components/store/ImageGallery'
import { ProductActions } from '@/components/store/ProductActions'
import { createClient } from '@/lib/supabase/client'
import { optimizeImageUrl } from '@/lib/image'
import { Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ProductImage {
    url: string
    is_primary?: boolean | null
}

interface ProductVariant {
    id: string
    sku: string
    size: string | null
    color_name: string | null
    color_hex: string | null
    price_delta: number
    is_active: boolean
    stock?: number
}

interface ProductData {
    id: string
    name: string
    slug: string
    description?: string | null
    price: number
    compare_price?: number | null
    weight_kg?: number
    images: ProductImage[]
    brand?: { name: string; logo_url?: string | null } | null
    category?: { id: string; name: string; slug: string } | null
    variants: ProductVariant[]
}

export function ProductPageClient({ slug, initialProduct = null }: { slug: string, initialProduct?: ProductData | null }) {
    const [product, setProduct] = useState<ProductData | null>(initialProduct)
    const [loading, setLoading] = useState(!initialProduct)

    useEffect(() => {
        if (initialProduct) return

        async function load() {
            setLoading(true)
            const supabase = createClient()

            if (!slug) {
                console.error('ProductPageClient: Slug is missing!');
                setLoading(false);
                return;
            }

            const { data: prodData, error } = await (supabase as any)
                .from('products')
                .select(`
                    id, name, slug, description, price, compare_price,
                    images:product_images(url, is_primary),
                    brand:brands(name, logo_url),
                    category:categories(id, name, slug),
                    variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
                `)
                .eq('slug', slug)
                .eq('is_active', true)
                .maybeSingle()

            if (error) {
                console.error('Supabase Error:', error);
            }

            if (prodData) {
                setProduct(prodData as ProductData)
            } else {
                // Tenta buscar ignorando case just in case
                const { data: retryData } = await (supabase as any)
                    .from('products')
                    .select('id, name, slug, description, price, compare_price, images:product_images(url, is_primary), brand:brands(name, logo_url), category:categories(id, name, slug), variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)')
                    .ilike('slug', slug)
                    .eq('is_active', true)
                    .maybeSingle();

                if (retryData) setProduct(retryData as ProductData);
            }
            setLoading(false)
        }
        load()
    }, [slug, initialProduct])

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

    const primaryImage = optimizeImageUrl(
        product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url,
        { width: 900, quality: 72 }
    )

    return (
        <main className="flex-1 bg-black">
            {/* Breadcrumb Minimalista */}
            <div className="bg-[#050505] border-b border-white/5">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <Link href="/" className="hover:text-white transition-colors">HOME</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/produtos" className="hover:text-white transition-colors">PRODUTOS</Link>
                    {product.category && (
                        <>
                            <ChevronRight className="h-3 w-3" />
                            <Link href={`/categorias/${product.category.slug}`} className="hover:text-white transition-colors">{product.category.name}</Link>
                        </>
                    )}
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-neutral-200 truncate">{product.name}</span>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid lg:grid-cols-12 gap-10 xl:gap-20 items-start">
                    {/* Galeria — Lado Esquerdo */}
                    <div className="lg:col-span-7">
                        <ImageGallery
                            images={product.images || []}
                            productName={product.name}
                        />
                    </div>

                    {/* Detalhes — Lado Direito (Sticky) */}
                    <div className="lg:col-span-5 flex flex-col gap-8 w-full lg:sticky lg:top-32">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                {product.brand && (
                                    <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">
                                        {product.brand.name}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                                {product.name}
                            </h1>
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
                            weightKg={product.weight_kg}
                        />

                        {/* Extra Info */}
                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <div className="prose prose-invert prose-sm max-w-none text-neutral-400 leading-relaxed italic">
                                {product.description}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
