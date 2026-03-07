'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { X, Plus, Loader2, ImagePlus, Save, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface ProductFormValues {
    name: string
    slug: string
    sku: string
    description: string
    price: string
    compare_price: string
    category_id: string
    brand_id: string
    collection_id: string
    weight_kg: string
    is_active: boolean
    is_new: boolean
}

interface ImagePreview { file: File; preview: string; uploading: boolean; url?: string }

interface Variant {
    id?: string; size: string; colorName: string; colorHex: string; priceDelta: number; sku: string; stock: number
}

interface ProductFormProps {
    categories: { id: string; name: string }[]
    brands: { id: string; name: string }[]
    collections?: { id: string; name: string }[]
    initialProduct?: any
    productId?: string // New
}

const SelectField = ({
    label, required = false, children, ...props
}: { label: string; required?: boolean; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="space-y-1">
        <Label>{label}{required && ' *'}</Label>
        <div className="relative">
            <select
                {...props}
                className="w-full h-10 rounded-md border border-input bg-zinc-900 text-white px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ colorScheme: 'dark', backgroundColor: '#18181b', color: '#ffffff' }}
            >
                {children}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    </div>
)


export function ProductFormClient({ categories: initCats, brands: initBrands, collections: initCols, initialProduct: incomingProduct, productId }: ProductFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()

    // ─── Estados do Produto ──────────────────────────────────
    const [initialProduct, setInitialProduct] = useState<any>(incomingProduct)
    const [loadingProduct, setLoadingProduct] = useState(!incomingProduct && !!productId)

    // ─── Estados do Formulário ────────────────────────
    const [images, setImages] = useState<ImagePreview[]>([])
    const [variants, setVariants] = useState<Variant[]>([{ size: '', colorName: '', colorHex: '#000000', priceDelta: 0, sku: '', stock: 0 }])

    // Sincroniza estados quando o produto chega (via prop ou fetch)
    useEffect(() => {
        if (initialProduct) {
            setImages(initialProduct.images?.map((img: any) => ({ preview: img.url, url: img.url, uploading: false })) || [])
            setVariants(initialProduct.variants?.map((v: any) => ({
                id: v.id, sku: v.sku, size: v.size || '', colorName: v.color_name || '', colorHex: v.color_hex || '#000000', priceDelta: v.price_delta || 0, stock: v.stock || 0
            })) || [{ size: '', colorName: '', colorHex: '#000000', priceDelta: 0, sku: '', stock: 0 }])
        }
    }, [initialProduct])

    // Carregamento de Dropdowns (categorias/marcas)
    const [categories, setCategories] = useState<{ id: string; name: string }[]>(initCats)
    const [brands, setBrands] = useState<{ id: string; name: string }[]>(initBrands)
    const [collections, setCollections] = useState<{ id: string; name: string }[]>(initCols ?? [])
    const [loadingDropdowns, setLoadingDropdowns] = useState(true)

    // Carregamento de Inicialização (Dropdowns + Produto se necessário)
    useEffect(() => {
        async function init() {
            setLoadingDropdowns(true)
            try {
                // Busca dropdowns
                const [catsData, brandsData, colsData] = await Promise.all([
                    fetch('/api/admin/categories').then(r => r.json()),
                    fetch('/api/admin/brands').then(r => r.json()),
                    fetch('/api/admin/collections').then(r => r.json()),
                ])
                if (Array.isArray(catsData)) setCategories(catsData)
                else if (Array.isArray(catsData.categories)) setCategories(catsData.categories)

                if (Array.isArray(brandsData)) setBrands(brandsData)
                else if (Array.isArray(brandsData.brands)) setBrands(brandsData.brands)

                if (Array.isArray(colsData)) setCollections(colsData)
                else if (Array.isArray(colsData.collections)) setCollections(colsData.collections)

                // Busca produto se só temos o ID
                if (!initialProduct && productId) {
                    setLoadingProduct(true)
                    const prodRes = await fetch(`/api/admin/products/${productId}`)
                    const prodData = await prodRes.json()
                    if (prodData.product) {
                        setInitialProduct(prodData.product)
                    }
                }
            } catch (err) {
                console.error('[init] Erro:', err)
                toast.error('Erro ao carregar dados.')
            } finally {
                setLoadingDropdowns(false)
                setLoadingProduct(false)
            }
        }
        init()
    }, [productId]) // eslint-disable-line

    const { register, handleSubmit, setValue, reset } = useForm<ProductFormValues>({
        defaultValues: {
            name: initialProduct?.name || '',
            slug: initialProduct?.slug || '',
            sku: initialProduct?.sku || '',
            description: initialProduct?.description || '',
            price: initialProduct?.price?.toString() || '',
            compare_price: initialProduct?.compare_price?.toString() || '',
            category_id: initialProduct?.category_id || '',
            brand_id: initialProduct?.brand_id || '',
            collection_id: initialProduct?.collection_id || '',
            weight_kg: initialProduct?.weight_kg?.toString() || '',
            is_active: initialProduct?.is_active ?? true,
            is_new: initialProduct?.is_new ?? false,
        },
    })

    // Atualiza os valores do formulário quando o produto termina de carregar
    useEffect(() => {
        if (initialProduct) {
            reset({
                name: initialProduct.name || '',
                slug: initialProduct.slug || '',
                sku: initialProduct.sku || '',
                description: initialProduct.description || '',
                price: initialProduct.price?.toString() || '',
                compare_price: initialProduct.compare_price?.toString() || '',
                category_id: initialProduct.category_id || '',
                brand_id: initialProduct.brand_id || '',
                collection_id: initialProduct.collection_id || '',
                weight_kg: initialProduct.weight_kg?.toString() || '',
                is_active: initialProduct.is_active ?? true,
                is_new: initialProduct.is_new ?? false,
            })
        }
    }, [initialProduct, reset])

    if (loadingProduct) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

    function generateSlug(name: string) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return

        const newPreviews: ImagePreview[] = files.map((f) => ({
            file: f, preview: URL.createObjectURL(f), uploading: true,
        }))
        setImages((prev) => [...prev, ...newPreviews])

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData()
            formData.append('file', files[i])
            formData.append('folder', 'products')
            try {
                const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                const data = await res.json()
                setImages((prev) => prev.map((img) => img.file === files[i] ? { ...img, uploading: false, url: data.url } : img))
            } catch (err) {
                setImages((prev) => prev.map((img) => img.file === files[i] ? { ...img, uploading: false } : img))
                toast.error(`Erro ao fazer upload de ${files[i].name}`)
            }
        }
    }

    function removeImage(index: number) {
        setImages((prev) => { const u = [...prev]; URL.revokeObjectURL(u[index].preview); u.splice(index, 1); return u })
    }

    function addVariant() {
        setVariants((prev) => [...prev, { size: '', colorName: '', colorHex: '#000000', priceDelta: 0, sku: '', stock: 0 }])
    }

    function removeVariant(i: number) { setVariants((prev) => prev.filter((_, idx) => idx !== i)) }

    function updateVariant(i: number, field: keyof Variant, value: string | number) {
        setVariants((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
    }

    async function onSubmit(data: ProductFormValues) {
        const uploadedImages = images.filter((img) => img.url)
        if (uploadedImages.length === 0) {
            toast.error('Adicione pelo menos uma imagem ao produto.')
            return
        }

        startTransition(async () => {
            try {
                const payload = {
                    ...data,
                    price: parseFloat(data.price),
                    compare_price: data.compare_price ? parseFloat(data.compare_price) : undefined,
                    weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
                    collection_id: data.collection_id || null,
                    images: uploadedImages.map((img, i) => ({
                        url: img.url!, is_primary: i === 0,
                    })),
                    variants: variants.filter((v) => v.sku || v.size || v.colorName).map(v => ({
                        ...v, priceDelta: parseFloat(v.priceDelta as any) || 0
                    })),
                }

                const url = initialProduct ? `/api/admin/products/${initialProduct.id}` : '/api/admin/products'
                const method = initialProduct ? 'PATCH' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error)
                toast.success(initialProduct ? 'Produto atualizado!' : 'Produto cadastrado com sucesso!')
                router.push('/admin/produtos')
                router.refresh()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">

            {/* ── Imagens ─────────────────────────────────────────── */}
            <div className="space-y-3">
                <h2 className="font-semibold text-base">Fotos do Produto</h2>
                <div className="flex flex-wrap gap-4 pb-4">
                    {images.map((img, i) => (
                        <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden border border-border">
                            <Image src={img.preview} alt={`Foto ${i + 1}`} fill className="object-cover" />
                            {img.uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                            )}
                            {i === 0 && !img.uploading && (
                                <Badge className="absolute top-1 left-1 text-[10px] py-0 gradient-brand text-white border-0">Principal</Badge>
                            )}
                            <button
                                type="button" onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button" onClick={() => fileInputRef.current?.click()}
                        className="h-24 w-24 rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">Adicionar</span>
                    </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground">A primeira foto será a imagem principal. JPG, PNG ou WEBP até 5MB.</p>
            </div>

            <Separator className="bg-border/40" />

            {/* ── Informações Básicas ──────────────────────────────── */}
            <div className="space-y-4">
                <h2 className="font-semibold text-base">Informações do Produto</h2>
                <div className="grid sm:grid-cols-2 gap-4">

                    <div className="sm:col-span-2 space-y-1">
                        <Label>Nome do Produto *</Label>
                        <Input
                            {...register('name')}
                            placeholder="Boné Chronic Five Panel"
                            onChange={(e) => {
                                register('name').onChange(e)
                                setValue('slug', generateSlug(e.target.value))
                            }}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Slug (URL) *</Label>
                        <Input {...register('slug')} placeholder="bone-chronic-five-panel" className="font-mono text-xs" />
                    </div>

                    <div className="space-y-1">
                        <Label>SKU</Label>
                        <Input {...register('sku')} placeholder="CHR-BP-001" className="font-mono" />
                    </div>

                    <div className="space-y-1">
                        <Label>Preço (R$) *</Label>
                        <Input {...register('price')} type="number" step="0.01" placeholder="119.90" />
                    </div>

                    <div className="space-y-1">
                        <Label>Preço Comparativo (De:)</Label>
                        <Input {...register('compare_price')} type="number" step="0.01" placeholder="149.90" />
                    </div>

                    {/* ── CATEGORIA ── */}
                    <SelectField label="Categoria" required {...register('category_id')}>
                        <option value="">{loadingDropdowns ? 'Carregando…' : 'Selecione uma categoria'}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </SelectField>

                    {/* ── MARCA ── */}
                    <SelectField label="Marca" required {...register('brand_id')}>
                        <option value="">{loadingDropdowns ? 'Carregando…' : 'Selecione uma marca'}</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </SelectField>

                    {/* ── COLEÇÃO (opcional) ── */}
                    <SelectField label="Coleção (opcional)" {...register('collection_id')}>
                        <option value="">Nenhuma coleção</option>
                        {collections.map((col) => (
                            <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                    </SelectField>

                    <div className="space-y-1">
                        <Label>Peso (kg)</Label>
                        <Input {...register('weight_kg')} type="number" step="0.001" placeholder="0.300" />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                        <Label>Descrição</Label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            placeholder="Boné Five Panel original Chronic, aba plana, bordado exclusivo…"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('is_active')} className="h-4 w-4 accent-orange-500" />
                            <span className="text-sm">Produto ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('is_new')} className="h-4 w-4 accent-orange-500" />
                            <span className="text-sm">Marcar como novidade</span>
                        </label>
                    </div>
                </div>
            </div>

            <Separator className="bg-border/40" />

            {/* ── Variantes ───────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-base">Variantes</h2>
                        <p className="text-xs text-muted-foreground">Tamanho, cor e SKU por variante. Deixe em branco se não houver.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Variante
                    </Button>
                </div>

                <div className="space-y-4">
                    {variants.map((v, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-3 p-4 rounded-xl bg-secondary/20 border border-border/40 relative">
                            {/* Botão excluir (aparece no canto em mobile, mas integrado em desktop) */}
                            {variants.length > 1 && (
                                <button
                                    type="button" onClick={() => removeVariant(i)}
                                    className="sm:hidden absolute top-2 right-2 h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs">SKU</Label>
                                <Input value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} placeholder="CHR-BP-UNI" className="h-9 text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Tamanho</Label>
                                    <Input value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} placeholder="P, U..." className="h-9 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Cor (Nome)</Label>
                                    <Input value={v.colorName} onChange={(e) => updateVariant(i, 'colorName', e.target.value)} placeholder="Preto" className="h-9 text-xs" />
                                </div>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs">Cor (Hex)</Label>
                                <div className="flex items-center gap-1">
                                    <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, 'colorHex', e.target.value)} className="h-9 w-10 rounded border border-input cursor-pointer flex-shrink-0 p-0" />
                                    <Input value={v.colorHex} onChange={(e) => updateVariant(i, 'colorHex', e.target.value)} className="h-9 text-xs font-mono flex-1 p-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Estoque</Label>
                                    <Input value={v.stock} onChange={(e) => updateVariant(i, 'stock', parseInt(e.target.value) || 0)} type="number" className="h-9 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Acréscimo R$</Label>
                                    <div className="flex items-center gap-2">
                                        <Input value={v.priceDelta} onChange={(e) => updateVariant(i, 'priceDelta', parseFloat(e.target.value) || 0)} type="number" step="0.01" className="h-9 text-xs flex-1" />
                                        {variants.length > 1 && (
                                            <button type="button" onClick={() => removeVariant(i)} className="hidden sm:flex h-9 w-9 flex-shrink-0 rounded-lg border border-destructive/50 text-destructive items-center justify-center hover:bg-destructive/10 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Botões */}
            <div className="flex gap-3 pb-6">
                <Button type="submit" disabled={isPending} className="gradient-brand text-white font-bold">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Produto
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
        </form>
    )
}
