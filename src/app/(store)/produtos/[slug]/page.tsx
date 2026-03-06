import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { ImageGallery } from '@/components/store/ImageGallery'
import { ProductActions } from '@/components/store/ProductActions'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('products').select('slug').eq('is_active', true)
    return data?.map((p) => ({ slug: p.slug })) || []
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = createServiceClient()

    const { data: product } = await supabase
        .from('products')
        .select(`
      *,
      images:product_images(url, is_primary, position),
      brand:brands(name, logo_url),
      variants:product_variants(*)
    `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!product) notFound()

    const primaryImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="container-store py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    <ImageGallery images={product.images || []} />

                    <div className="space-y-8">
                        <div>
                            {product.is_new && (
                                <Badge className="bg-primary hover:bg-primary/90 text-white font-bold mb-4">
                                    NOVIDADE
                                </Badge>
                            )}
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-3xl font-black text-primary">
                                    {formatCurrency(product.price)}
                                </span>
                                {product.compare_price && (
                                    <span className="text-xl text-neutral-500 line-through">
                                        {formatCurrency(product.compare_price)}
                                    </span>
                                )}
                            </div>
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
                                <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-neutral-400">Descrição</h3>
                                <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed">
                                    {product.description}
                                </div>
                            </div>

                            {product.brand && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    {product.brand.logo_url && (
                                        <div className="h-12 w-12 relative rounded-lg overflow-hidden bg-white/10">
                                            <Image src={product.brand.logo_url} alt={product.brand.name} fill className="object-contain p-2" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Marca</p>
                                        <p className="font-bold text-lg">{product.brand.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
