import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'

export async function generateStaticParams() {
    const supabase = createServiceClient()
    const { data } = await supabase.from('categories').select('slug').eq('is_active', true)
    return data?.map((cat) => ({ slug: cat.slug })) || []
}

export default async function CategoriaPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = createServiceClient()

    const { data: categoria } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!categoria) notFound()

    const { data: products } = await supabase
        .from('products')
        .select(`
      *,
      images:product_images(url, is_primary),
      brand:brands(name)
    `)
        .eq('category_id', categoria.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <div className="container-store py-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{categoria.name}</h1>
                    <p className="text-neutral-400 mt-4 max-w-xl">{categoria.description}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {products?.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.name}
                            slug={product.slug}
                            price={product.price}
                            comparePrice={product.compare_price}
                            imageUrl={product.images?.[0]?.url}
                            brandName={product.brand?.name}
                            isNew={product.is_new}
                        />
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    )
}
