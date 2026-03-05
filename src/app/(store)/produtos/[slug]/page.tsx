import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ImageGallery } from '@/components/store/ImageGallery'
import { ProductActions } from '@/components/store/ProductActions'
import { ShippingCalculator } from '@/components/store/ShippingCalculator'
import { ProductCard } from '@/components/store/ProductCard'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()
    const { data: product } = await supabase
        .from('products')
        .select('name, description')
        .eq('slug', slug)
        .single()

    if (!product) return { title: 'Produto não encontrado' }
    return {
        title: `${product.name} | Cola Comigo Shop`,
        description: product.description ?? undefined,
    }
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    // Busca produto completo com todas as relações
    const { data: product } = await supabase
        .from('products')
        .select(`
      *,
      brand:brands(name, slug),
      category:categories(name, slug),
      images:product_images(url, alt_text, is_primary, position),
      variants:product_variants(
        id, sku, size, color_name, color_hex, price_delta:price, is_active, stock
      )
    `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!product) notFound()

    // Normaliza imagens ordenadas por posição
    const images = (product.images ?? [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((img: { url: string; alt_text?: string }) => ({ url: img.url, alt: img.alt_text }))

    // Normaliza variantes com estoque
    const variants = (product.variants ?? []).map((v: any) => ({
        ...v,
        stock: v.stock ?? 0,
    }))

    const primaryImage = images[0]?.url ?? null

    // Busca produtos relacionados (mesma categoria, exceto o atual)
    const { data: related } = await supabase
        .from('products')
        .select(`
      *,
      brand:brands(name),
      images:product_images(url, is_primary),
      variants:product_variants(id, sku, size, color_name, color_hex, price_delta:price, is_active, stock)
    `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(4)

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black">
                {/* Breadcrumb Brutalista */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 border-b border-white/5">
                    <nav className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-neutral-500">
                        <Link href="/" className="hover:text-white transition-colors">INÍCIO</Link>
                        <ChevronRight className="h-3 w-3" />
                        {product.category && (
                            <>
                                <Link
                                    href={`/categorias/${product.category.slug}`}
                                    className="hover:text-white transition-colors"
                                >
                                    {product.category.name}
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                            </>
                        )}
                        <span className="text-white truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>

                {/* Produto */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                        {/* Coluna esquerda: Galeria Minimalista/Dark */}
                        <div className="lg:sticky lg:top-32 h-max">
                            <ImageGallery images={images} productName={product.name} />
                        </div>

                        {/* Coluna direita: Info + Ações Brutalistas */}
                        <div className="space-y-8">
                            {/* Cabeçalho */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {product.brand && (
                                        <Link href={`/marcas/${product.brand.slug}`}>
                                            <Badge className="bg-transparent border border-white/20 text-neutral-400 text-[10px] font-black tracking-widest hover:border-white hover:text-white transition-colors rounded-none px-3 py-1 uppercase">
                                                {product.brand.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    {product.collection && (
                                        <Badge className="bg-white/5 text-white border-0 rounded-none text-[10px] font-bold tracking-widest px-3 py-1 uppercase">
                                            {product.collection}
                                        </Badge>
                                    )}
                                    {product.is_new && (
                                        <Badge className="bg-primary text-black border-0 rounded-none text-[10px] font-black tracking-widest px-3 py-1 uppercase">
                                            NOVO DROP
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black tracking-tighter leading-[0.9] text-white uppercase">{product.name}</h1>
                                {product.sku && (
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">REF: {product.sku}</p>
                                )}
                            </div>

                            <Separator className="bg-white/10" />

                            {/* Ações (preço, variantes, add to cart) */}
                            <ProductActions
                                productId={product.id}
                                productName={product.name}
                                productSlug={product.slug}
                                basePrice={product.price}
                                comparePrice={product.compare_price}
                                imageUrl={primaryImage}
                                variants={variants}
                                whatsappNumber="5563991312913"
                            />

                            <Separator className="bg-border/40" />

                            {/* Calculadora de Frete */}
                            <ShippingCalculator weightKg={product.weight_kg ?? 0.3} />

                            {/* Descrição */}
                            {product.description && (
                                <>
                                    <Separator className="bg-border/40" />
                                    <div className="space-y-2">
                                        <h2 className="font-semibold">Descrição</h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Produtos Relacionados */}
                {related && related.length > 0 && (
                    <div className="border-t border-white/5 py-12 lg:py-24 bg-zinc-950">
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-black tracking-tighter uppercase text-white mb-8">COMPRE JUNTO</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                                {related.map((p) => {
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
                        </div>
                    </div>
                )}
            </main>
            <Footer />
            <CartDrawer />
        </>
    )
}
