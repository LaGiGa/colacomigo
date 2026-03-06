'use client'

import { useState, useEffect } from 'react'
import { Filter, SlidersHorizontal, Loader2, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { AnnouncementBar } from '@/components/store/StoreDynamicComponents'

interface Category {
    id: string
    name: string
    slug: string
    parent_id: string | null
}

interface Props {
    initialCategory?: string | null
    initialCollection?: string | null
    initialMarca?: string | null
}

export function ProdutosPageClient({ initialCategory = null, initialCollection = null, initialMarca = null }: Props) {
    const [products, setProducts] = useState<any[]>([])
    const [dbCategories, setDbCategories] = useState<Category[]>([])
    const [dbBrands, setDbBrands] = useState<any[]>([])
    const [dbCollections, setDbCollections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [categoria, setCategoria] = useState<string | null>(initialCategory)
    const [colecao, setColecao] = useState<string | null>(initialCollection)
    const [marca, setMarca] = useState<string | null>(initialMarca)
    const [ordem, setOrdem] = useState<string>('novos')

    useEffect(() => {
        // Se mudou via props externas (navegação)
        setCategoria(initialCategory)
        setColecao(initialCollection)
        setMarca(initialMarca)
    }, [initialCategory, initialCollection, initialMarca])

    // Carregar filtros do banco para o Sidebar
    useEffect(() => {
        async function loadFilters() {
            const supabase = createClient()
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
        }
        loadFilters()
    }, [])

    useEffect(() => {
        async function load() {
            setLoading(true)
            const supabase = createClient()
            let query = (supabase as any)
                .from('products')
                .select(`
                    *,
                    brand:brands(name),
                    images:product_images(url, is_primary),
                    variants:product_variants(id, sku, size, color_name, color_hex, price_delta, is_active, stock)
                `)
                .eq('is_active', true)


            if (categoria) {
                // Tenta encontrar ID localmente ou busca no banco
                let catId = dbCategories.find(c => c.slug === categoria)?.id
                if (!catId) {
                    const { data: catData } = await supabase.from('categories').select('id').eq('slug', categoria).single()
                    if (catData) catId = catData.id
                }
                if (catId) query = query.eq('category_id', catId)
            }

            if (colecao) {
                const { data: colData } = await supabase.from('collections').select('id').eq('slug', colecao).single()
                if (colData) query = query.eq('collection_id', colData.id)
            }

            if (marca) {
                const { data: brandData } = await supabase.from('brands').select('id').eq('slug', marca).single()
                if (brandData) query = query.eq('brand_id', brandData.id)
            }

            if (ordem === 'menor') query = query.order('price', { ascending: true })
            else if (ordem === 'maior') query = query.order('price', { ascending: false })
            else query = query.order('created_at', { ascending: false })

            const { data, error } = await query
            if (error) {
                console.error("Erro ao carregar produtos:", error)
            }
            setProducts(data || [])
            setLoading(false)
        }
        load()
    }, [categoria, colecao, ordem, dbCategories.length])

    const currentTitle = categoria
        ? dbCategories.find(c => c.slug === categoria)?.name
        : colecao
            ? colecao.replace(/-/g, ' ').toUpperCase()
            : marca
                ? marca.replace(/-/g, ' ').toUpperCase()
                : 'A COLA'

    return (
        <div className="flex flex-col min-h-screen">
            <AnnouncementBar />
            <Header />
            <main className="flex-1 bg-black">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    {/* Header da Coleção/Categoria */}
                    <div className="mb-16 pb-8 border-b border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
                            <h2 className="text-[120px] font-black tracking-tighter leading-none select-none">{currentTitle}</h2>
                        </div>
                        <h1 className="text-[clamp(3rem,6vw,5rem)] font-black tracking-tighter uppercase leading-none text-white relative z-10">
                            {currentTitle}
                        </h1>
                        <p className="text-primary mt-4 font-black tracking-[0.3em] uppercase text-[10px] relative z-10">
                            {products.length} RESULTADOS ENCONTRADOS
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar (Agora Dinâmico) */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-12">
                                <div>
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-primary" /> CATEGORIAS DETALHADAS
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => {
                                                setCategoria(null)
                                                setColecao(null)
                                                setMarca(null)
                                                window.history.pushState({}, '', '/produtos')
                                            }}
                                            className={`group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${(!categoria && !colecao && !marca)
                                                ? 'bg-primary text-white pl-6'
                                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            TODOS OS PRODUTOS
                                            {(!categoria && !colecao && !marca) && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </button>

                                        {dbCategories.filter(c => !c.parent_id).map((cat) => (
                                            <div key={cat.id} className="mt-1">
                                                <button
                                                    onClick={() => {
                                                        setCategoria(cat.slug)
                                                        setColecao(null)
                                                        setMarca(null)
                                                        window.history.pushState({}, '', `/categorias/${cat.slug}`)
                                                    }}
                                                    className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${categoria === cat.slug
                                                        ? 'bg-zinc-800 text-white pl-6'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l border-white/5'
                                                        }`}
                                                >
                                                    {cat.name}
                                                    {categoria === cat.slug && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </button>

                                                {/* Subcategorias DETALHADAS */}
                                                {(categoria === cat.slug || dbCategories.find(c => c.slug === categoria)?.parent_id === cat.id) && (
                                                    <div className="ml-4 border-l border-white/10 flex flex-col py-2 gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        {dbCategories.filter(sub => sub.parent_id === cat.id).map(sub => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => {
                                                                    setCategoria(sub.slug)
                                                                    setColecao(null)
                                                                    setMarca(null)
                                                                    window.history.pushState({}, '', `/categorias/${sub.slug}`)
                                                                }}
                                                                className={`w-full text-left group flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${categoria === sub.slug
                                                                    ? 'text-primary'
                                                                    : 'text-neutral-600 hover:text-neutral-300'
                                                                    }`}
                                                            >
                                                                <ChevronRight className={`w-3 h-3 ${categoria === sub.slug ? 'translate-x-1' : ''} transition-transform`} />
                                                                {sub.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {dbCollections.length > 0 && (
                                    <div>
                                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-primary" /> DROPS & COLEÇÕES
                                        </h2>
                                        <div className="flex flex-col gap-1">
                                            {dbCollections.map((col) => (
                                                <button
                                                    key={col.id}
                                                    onClick={() => {
                                                        setColecao(col.slug)
                                                        setCategoria(null)
                                                        setMarca(null)
                                                        window.history.pushState({}, '', `/colecoes/${col.slug}`)
                                                    }}
                                                    className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${colecao === col.slug
                                                        ? 'bg-zinc-800 text-white pl-6'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l border-white/5'
                                                        }`}
                                                >
                                                    {col.name}
                                                    {colecao === col.slug && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dbBrands.length > 0 && (
                                    <div>
                                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-primary" /> MARCAS (AUTORIDADE)
                                        </h2>
                                        <div className="flex flex-col gap-1">
                                            {dbBrands.map((brand) => (
                                                <button
                                                    key={brand.id}
                                                    onClick={() => {
                                                        setMarca(brand.slug)
                                                        setCategoria(null)
                                                        setColecao(null)
                                                        window.history.pushState({}, '', `/marcas/${brand.slug}`)
                                                    }}
                                                    className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${marca === brand.slug
                                                        ? 'bg-zinc-800 text-white pl-6'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l border-white/5'
                                                        }`}
                                                >
                                                    {brand.name}
                                                    {marca === brand.slug && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <div>
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-primary" /> ORDENAR POR
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { label: 'HYPE (RECÉM CHEGADOS)', value: 'novos' },
                                            { label: 'MENOR PREÇO', value: 'menor' },
                                            { label: 'DOMINANTES (PREMIUM)', value: 'maior' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setOrdem(opt.value)}
                                                className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border border-transparent text-left ${ordem === opt.value
                                                    ? 'border-primary/30 text-primary bg-primary/5'
                                                    : 'text-neutral-500 hover:text-white hover:border-white/10'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Grid de Produtos */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                            ) : products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
                                    {products.map((p) => (
                                        <ProductCard
                                            key={p.id}
                                            id={p.id}
                                            name={p.name}
                                            slug={p.slug}
                                            price={p.price}
                                            comparePrice={p.compare_price}
                                            imageUrl={p.images?.[0]?.url ?? null}
                                            secondImageUrl={p.images?.[1]?.url ?? null}
                                            brandName={p.brand?.name ?? null}
                                            isNew={p.is_new ?? false}
                                            variantId={p.variants?.[0]?.id ?? null}
                                            variantSku={p.variants?.[0]?.sku ?? null}
                                            inStock={p.variants?.some((v: any) => (v.stock ?? 0) > 0) ?? false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-zinc-950/50">
                                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Filter className="h-8 w-8 text-neutral-800" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Sem Drop Disponível</h3>
                                    <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-[280px]">
                                        OS PRODUTOS DESTA CATEGORIA AINDA ESTÃO NO FORNO.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    )
}
