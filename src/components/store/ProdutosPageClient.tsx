'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Filter, SlidersHorizontal, Loader2, ChevronRight, X, ArrowDownUp, Plus, Minus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ProductCard = dynamic(() => import('@/components/store/ProductCard').then(mod => mod.ProductCard), {
    ssr: false,
    loading: () => <div className="aspect-[3/4] bg-zinc-950 animate-pulse" />
})

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
    initialProducts?: any[]
    initialCategories?: Category[]
    initialBrands?: any[]
    initialCollections?: any[]
    initialSearch?: string | null
    initialType?: string | null
    initialSlug?: string | null
}

export function ProdutosPageClient({
    initialCategory = null,
    initialCollection = null,
    initialMarca = null,
    initialProducts,
    initialCategories,
    initialBrands,
    initialCollections,
    initialSearch = null,
    initialType = null,
    initialSlug = null,
}: Props) {
    const [products, setProducts] = useState<any[]>(initialProducts ?? [])
    const [dbCategories, setDbCategories] = useState<Category[]>(initialCategories ?? [])
    const [dbBrands, setDbBrands] = useState<any[]>(initialBrands ?? [])
    const [dbCollections, setDbCollections] = useState<any[]>(initialCollections ?? [])
    const [loading, setLoading] = useState(initialProducts === undefined || initialProducts.length === 0)
    const [categoria, setCategoria] = useState<string | null>(initialCategory)
    const [colecao, setColecao] = useState<string | null>(initialCollection)
    const [marca, setMarca] = useState<string | null>(initialMarca)
    const [ordem, setOrdem] = useState<string>('novos')
    const [visibleCount, setVisibleCount] = useState(10)
    const [search, setSearch] = useState<string | null>(initialSearch)
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
    const [isMobileSortOpen, setIsMobileSortOpen] = useState(false)
    const [openAccordion, setOpenAccordion] = useState<string | null>('categorias')
    const skipFirstFetchRef = useRef(initialProducts !== undefined && initialProducts.length > 0)
    const productsCacheRef = useRef<Map<string, any[]>>(new Map())
    const loadMoreRef = useRef<HTMLDivElement | null>(null)


    // Carregar filtros do banco para o Sidebar
    useEffect(() => {
        if (initialCategories !== undefined && initialBrands !== undefined && initialCollections !== undefined) {
            return
        }

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
            const initialKey = `${initialCategory ?? ''}|${initialCollection ?? ''}|${initialMarca ?? ''}|${initialSearch ?? ''}|novos`
            const currentKey = `${categoria ?? ''}|${colecao ?? ''}|${marca ?? ''}|${search ?? ''}|${ordem}`

            if (skipFirstFetchRef.current && currentKey === initialKey) {
                skipFirstFetchRef.current = false
                productsCacheRef.current.set(currentKey, initialProducts ?? [])
                setLoading(false)
                return
            }
            skipFirstFetchRef.current = false

            if (productsCacheRef.current.has(currentKey)) {
                setProducts(productsCacheRef.current.get(currentKey) ?? [])
                setLoading(false)
                return
            }

            setLoading(true)
            const supabase = createClient()
            let query = (supabase as any)
                .from('products')
                .select(`
                    id, name, slug, price, compare_price,
                    brand:brands(name),
                    images:product_images(url, is_primary),
                    variants:product_variants(id, sku, is_active, stock)
                `)
                .eq('is_active', true)


            if (categoria) {
                let catId = dbCategories.find(c => c.slug === categoria)?.id
                if (!catId) {
                    const { data: catData } = await supabase.from('categories').select('id').eq('slug', categoria).single()
                    if (catData) catId = catData.id
                }
                if (catId) query = query.eq('category_id', catId)
            }

            if (colecao) {
                const colId = dbCollections.find((c: any) => c.slug === colecao)?.id
                if (colId) {
                    query = query.eq('collection_id', colId)
                } else {
                    const { data: colData } = await supabase.from('collections').select('id').eq('slug', colecao).single()
                    if (colData) query = query.eq('collection_id', colData.id)
                }
            }

            if (marca) {
                const brandId = dbBrands.find((b: any) => b.slug === marca)?.id
                if (brandId) {
                    query = query.eq('brand_id', brandId)
                } else {
                    const { data: brandData } = await supabase.from('brands').select('id').eq('slug', marca).single()
                    if (brandData) query = query.eq('brand_id', brandData.id)
                }
            }
            
            if (search) {
                query = query.ilike('name', `%${search}%`)
            }

            if (ordem === 'menor') query = query.order('price', { ascending: true })
            else if (ordem === 'maior') query = query.order('price', { ascending: false })
            else query = query.order('created_at', { ascending: false })

            const { data, error } = await query
            if (error) {
                console.error("Erro ao carregar produtos:", error)
            }
            const productsData = data || []
            productsCacheRef.current.set(currentKey, productsData)
            setProducts(productsData)
            setVisibleCount(10)
            setLoading(false)
        }
        load()
    }, [categoria, colecao, marca, search, ordem, dbCategories, dbBrands, dbCollections, initialCategory, initialCollection, initialMarca, initialSearch, initialProducts])

    const currentTitle = search 
        ? `BUSCA: ${search.toUpperCase()}`
        : categoria
            ? dbCategories.find(c => c.slug === categoria)?.name
            : colecao
                ? colecao.replace(/-/g, ' ').toUpperCase()
                : marca
                    ? marca.replace(/-/g, ' ').toUpperCase()
                    : 'A COLA'
    const displayedProducts = products.slice(0, visibleCount)

    useEffect(() => {
        const sentinel = loadMoreRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0]
                if (first.isIntersecting) {
                    setVisibleCount((prev) => (prev < products.length ? Math.min(prev + 10, products.length) : prev))
                }
            },
            { rootMargin: '300px 0px' }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [products.length])

    return (
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

                {/* Mobile Bar: Ordenar | Filtrar */}
                <div className="lg:hidden flex items-center border-y border-white/10 mb-8 bg-black sticky top-[72px] z-30 -translate-y-px">
                    <button onClick={() => setIsMobileSortOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors border-r border-white/10">
                        <ArrowDownUp className="w-3.5 h-3.5" /> Ordenar
                    </button>
                    <button onClick={() => setIsMobileFilterOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                        <Filter className="w-3.5 h-3.5" /> Filtrar
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 flex flex-col gap-y-12">
                            <div>
                                <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-primary" /> CATEGORIAS DETALHADAS
                                </h2>
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => {
                                            setCategoria(null)
                                            setColecao(null)
                                            setMarca(null)
                                            setSearch(null)
                                            window.history.pushState({}, '', '/produtos')
                                        }}
                                        className={`group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${(!categoria && !colecao && !marca && !search)
                                            ? 'bg-zinc-800 text-white border border-white/5'
                                            : 'text-neutral-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/5'
                                            }`}
                                    >
                                        TODOS OS PRODUTOS
                                        {(!categoria && !colecao && !marca && !search) && <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                    </button>

                                    {dbCategories.filter(c => !c.parent_id).map((cat) => {
                                        const isActiveCategory = categoria === cat.slug;
                                        const hasActiveSub = dbCategories.find(c => c.slug === categoria)?.parent_id === cat.id;
                                        const isExpanded = isActiveCategory || hasActiveSub;

                                        return (
                                            <div key={cat.id} className="mt-1">
                                                <button
                                                    onClick={() => {
                                                        setCategoria(cat.slug)
                                                        setColecao(null)
                                                        setMarca(null)
                                                        setSearch(null)
                                                        window.history.pushState({}, '', `/categorias/${cat.slug}`)
                                                    }}
                                                    className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${isExpanded
                                                        ? 'bg-zinc-800 text-white border border-white/5'
                                                        : 'text-neutral-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/5'
                                                        }`}
                                                >
                                                    {cat.name}
                                                    {isExpanded && <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                                </button>

                                                {/* Subcategorias DETALHADAS */}
                                                {isExpanded && (
                                                    <div className="ml-2 pl-2 border-l-2 border-primary/20 flex flex-col pt-1.5 pb-2 gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        {dbCategories.filter(sub => sub.parent_id === cat.id).map(sub => (
                                                            <button
                                                                 key={sub.id}
                                                                onClick={() => {
                                                                    setCategoria(sub.slug)
                                                                    setColecao(null)
                                                                    setMarca(null)
                                                                    setSearch(null)
                                                                    window.history.pushState({}, '', `/categorias/${sub.slug}`)
                                                                }}
                                                                className={`w-full text-left group flex items-center gap-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${categoria === sub.slug
                                                                    ? 'text-primary bg-primary/10 font-black'
                                                                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <ChevronRight className={`w-3 h-3 ${categoria === sub.slug ? 'translate-x-1 text-primary' : 'text-neutral-600 group-hover:text-neutral-400'} transition-transform`} />
                                                                {sub.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {dbCollections.length > 0 && (
                                <div>
                                    <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
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
                                                    setSearch(null)
                                                    window.history.pushState({}, '', `/colecoes/${col.slug}`)
                                                }}
                                                className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${colecao === col.slug
                                                    ? 'bg-zinc-800 text-white border border-white/5'
                                                    : 'text-neutral-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/5'
                                                    }`}
                                            >
                                                {col.name}
                                                {colecao === col.slug && <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {dbBrands.length > 0 && (
                                <div>
                                    <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
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
                                                    setSearch(null)
                                                    window.history.pushState({}, '', `/marcas/${brand.slug}`)
                                                }}
                                                className={`w-full group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${marca === brand.slug
                                                    ? 'bg-zinc-800 text-white border border-white/5'
                                                    : 'text-neutral-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/5'
                                                    }`}
                                            >
                                                {brand.name}
                                                {marca === brand.slug && <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}


                            <div>
                                <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
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
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg text-left ${ordem === opt.value
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'text-neutral-500 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/5'
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
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 w-full">
                                    {displayedProducts.map((p) => (
                                        (() => {
                                            const activeVariants = (p.variants ?? []).filter((v: any) => v.is_active !== false)
                                            const firstActiveVariant = activeVariants[0]
                                            const isInStock = activeVariants.length === 0
                                                ? true
                                                : activeVariants.some((v: any) => (v.stock ?? 0) > 0)

                                            return (
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
                                                    variantId={firstActiveVariant?.id ?? null}
                                                    variantSku={firstActiveVariant?.sku ?? null}
                                                    inStock={isInStock}
                                                />
                                            )
                                        })()
                                    ))}
                                </div>
                                {products.length > visibleCount && (
                                    <div className="mt-8 flex justify-center">
                                        <div
                                            ref={loadMoreRef}
                                            className="text-[10px] font-black tracking-widest uppercase text-neutral-500 py-3 px-6 border border-white/10"
                                        >
                                            Carregando mais...
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-zinc-950/50">
                                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Filter className="h-8 w-8 text-neutral-800" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Sem Drop Disponível</h3>
                                <p className="text-sm font-bold tracking-widest text-neutral-500 uppercase max-w-[280px]">
                                    {search ? `NÃO ENCONTRAMOS NADA PARA "${search.toUpperCase()}".` : 'OS PRODUTOS DESTA CATEGORIA AINDA ESTÃO NO FORNO.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Filtro (Mobile) */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col lg:hidden animate-in fade-in slide-in-from-bottom border-t border-white/5">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="text-lg font-bold uppercase text-white tracking-widest">Filtrar</h2>
                        <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {/* Categorias Accordion */}
                        <div className="border-b border-white/5 pb-2">
                            <button
                                onClick={() => setOpenAccordion(openAccordion === 'categorias' ? null : 'categorias')}
                                className="w-full flex items-center justify-between py-4 text-sm font-bold tracking-widest text-white transition-opacity"
                            >
                                Categorias
                                {openAccordion === 'categorias' ? <Minus className="w-4 h-4 text-neutral-500" strokeWidth={1} /> : <Plus className="w-4 h-4 text-neutral-500" strokeWidth={1} />}
                            </button>
                            {openAccordion === 'categorias' && (
                                <div className="mt-2 mb-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={() => {
                                            setCategoria(null)
                                            setColecao(null)
                                            setMarca(null)
                                            setSearch(null)
                                            window.history.pushState({}, '', '/produtos')
                                            setIsMobileFilterOpen(false)
                                        }}
                                        className={`text-left text-[11px] font-bold tracking-widest ${(!categoria && !colecao && !marca && !search) ? 'text-primary' : 'text-neutral-400'}`}
                                    >
                                        TODOS OS PRODUTOS
                                    </button>
                                    {dbCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setCategoria(cat.slug)
                                                setColecao(null)
                                                setMarca(null)
                                                setSearch(null)
                                                window.history.pushState({}, '', `/categorias/${cat.slug}`)
                                                setIsMobileFilterOpen(false)
                                            }}
                                            className={`text-left text-[11px] font-bold tracking-widest ${categoria === cat.slug ? 'text-primary' : 'text-neutral-400'}`}
                                        >
                                            {cat.parent_id ? `— ${cat.name}` : cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Marcas Accordion */}
                        {dbBrands.length > 0 && (
                            <div className="border-b border-white/5 pb-2">
                                <button
                                    onClick={() => setOpenAccordion(openAccordion === 'marcas' ? null : 'marcas')}
                                    className="w-full flex items-center justify-between py-4 text-sm font-bold tracking-widest text-white transition-opacity"
                                >
                                    Marcas
                                    {openAccordion === 'marcas' ? <Minus className="w-4 h-4 text-neutral-500" strokeWidth={1} /> : <Plus className="w-4 h-4 text-neutral-500" strokeWidth={1} />}
                                </button>
                                {openAccordion === 'marcas' && (
                                    <div className="mt-2 mb-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                                        {dbBrands.map((brand) => (
                                            <button
                                                key={brand.id}
                                                onClick={() => {
                                                    setMarca(brand.slug)
                                                    setCategoria(null)
                                                    setColecao(null)
                                                    setSearch(null)
                                                    window.history.pushState({}, '', `/marcas/${brand.slug}`)
                                                    setIsMobileFilterOpen(false)
                                                }}
                                                className={`text-left text-[11px] font-bold uppercase tracking-widest ${marca === brand.slug ? 'text-primary' : 'text-neutral-400'}`}
                                            >
                                                {brand.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Colecoes Accordion */}
                        {dbCollections.length > 0 && (
                            <div className="border-b border-white/5 pb-2">
                                <button
                                    onClick={() => setOpenAccordion(openAccordion === 'colecoes' ? null : 'colecoes')}
                                    className="w-full flex items-center justify-between py-4 text-sm font-bold tracking-widest text-white transition-opacity"
                                >
                                    Coleções
                                    {openAccordion === 'colecoes' ? <Minus className="w-4 h-4 text-neutral-500" strokeWidth={1} /> : <Plus className="w-4 h-4 text-neutral-500" strokeWidth={1} />}
                                </button>
                                {openAccordion === 'colecoes' && (
                                    <div className="mt-2 mb-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                                        {dbCollections.map((col) => (
                                            <button
                                                key={col.id}
                                                onClick={() => {
                                                    setColecao(col.slug)
                                                    setCategoria(null)
                                                    setMarca(null)
                                                    setSearch(null)
                                                    window.history.pushState({}, '', `/colecoes/${col.slug}`)
                                                    setIsMobileFilterOpen(false)
                                                }}
                                                className={`text-left text-[11px] font-bold uppercase tracking-widest ${colecao === col.slug ? 'text-primary' : 'text-neutral-400'}`}
                                            >
                                                {col.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Botão Aplicar */}
                    <div className="p-6 border-t border-white/5 pb-10">
                        <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-[#B2B2B2] text-black font-medium tracking-tight py-3 text-sm hover:bg-white transition-colors">
                            Aplicar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Ordenar (Mobile) */}
            {isMobileSortOpen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col lg:hidden animate-in fade-in slide-in-from-bottom border-t border-white/5">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="text-lg font-bold uppercase text-white tracking-widest">Ordenar</h2>
                        <button onClick={() => setIsMobileSortOpen(false)} className="p-2 -mr-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                        {[
                            { label: 'HYPE (RECÉM CHEGADOS)', value: 'novos' },
                            { label: 'MENOR PREÇO', value: 'menor' },
                            { label: 'DOMINANTES (PREMIUM)', value: 'maior' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setOrdem(opt.value)
                                    setIsMobileSortOpen(false)
                                }}
                                className={`w-full text-left text-xs font-bold uppercase tracking-widest flex items-center justify-between ${ordem === opt.value ? 'text-primary' : 'text-neutral-400'}`}
                            >
                                {opt.label}
                                {ordem === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
