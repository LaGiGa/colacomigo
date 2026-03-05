'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductCardProps {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number | null
    imageUrl?: string | null
    secondImageUrl?: string | null   // hover image
    brandName?: string | null
    isNew?: boolean
    variantId?: string
    variantSku?: string
    inStock?: boolean
}

export function ProductCard({
    id,
    name,
    slug,
    price,
    comparePrice,
    imageUrl,
    secondImageUrl,
    brandName,
    isNew,
    variantId,
    variantSku,
    inStock = true,
}: ProductCardProps) {
    const addItem = useCartStore((s) => s.addItem)
    const openCart = useUIStore((s) => s.openCart)

    const hasDiscount = comparePrice && comparePrice > price
    const discountPct = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
    const pixPrice = price * 0.95

    function handleQuickAdd(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!variantId) return

        addItem({
            variantId,
            productId: id,
            productName: name,
            productSlug: slug,
            variantSku: variantSku ?? '',
            size: null,
            colorName: null,
            colorHex: null,
            price,
            imageUrl: imageUrl ?? null,
        })
        toast.success(`${name} adicionado!`)
        openCart()
    }

    return (
        <Link href={`/produtos/${slug}`} className="block group">
            <div className="product-card bg-black border border-white/5 hover:border-white/20 transition-all">

                {/* ── Imagem Cortante ──────────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-zinc-950" style={{ aspectRatio: '3/4' }}>
                    {imageUrl ? (
                        <>
                            {/* Imagem principal */}
                            <Image
                                src={imageUrl}
                                alt={name}
                                fill
                                className={`object-cover transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105 ${secondImageUrl ? 'group-hover:opacity-0' : ''}`}
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            {/* Segunda imagem (hover) */}
                            {secondImageUrl && (
                                <Image
                                    src={secondImageUrl}
                                    alt={`${name} — detalhe`}
                                    fill
                                    className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, 25vw"
                                />
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-white/10" />
                        </div>
                    )}

                    {/* Badges Brutalistas */}
                    <div className="absolute top-0 left-0 flex flex-col gap-0 z-10 w-full">
                        {!inStock && (
                            <span className="bg-neutral-800 text-neutral-400 font-black text-[10px] tracking-widest px-3 py-1.5 uppercase text-center w-full">
                                ESGOTADO
                            </span>
                        )}
                        {hasDiscount && inStock && (
                            <span className="bg-red-600 text-white font-black text-[10px] tracking-widest px-3 py-1.5 uppercase text-center w-full">
                                {discountPct}% OFF
                            </span>
                        )}
                        {isNew && !hasDiscount && inStock && (
                            <span className="bg-primary text-black font-black text-[10px] tracking-widest px-3 py-1.5 uppercase text-center w-full">
                                NOVO DROP
                            </span>
                        )}
                    </div>

                    {/* Quick add — Extreme Feedback */}
                    {variantId && inStock && (
                        <button
                            onClick={handleQuickAdd}
                            style={{ backgroundColor: '#1a8fff' }}
                            className="absolute bottom-0 left-0 right-0 text-white text-[10px] font-black tracking-widest py-3 translate-y-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 block border-t border-white/10 z-20"
                        >
                            ADICIONAR AO CARRINHO
                        </button>
                    )}
                    {!inStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
                    )}
                </div>

                {/* ── Info Typography ────────────────────────────────────────────── */}
                <div className="p-4 space-y-2 border-t border-white/5">
                    {brandName && (
                        <p className="text-[9px] font-black tracking-[0.2em] text-neutral-500 uppercase">
                            {brandName}
                        </p>
                    )}
                    <h3 className="text-sm font-black leading-tight line-clamp-2 uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                        {name}
                    </h3>

                    {/* Preços */}
                    <div className="space-y-1 pt-2">
                        <div className="flex items-end gap-2 flex-wrap">
                            <span className="text-lg font-black text-white tracking-widest">
                                {formatCurrency(price)}
                            </span>
                            {hasDiscount && (
                                <span className="text-[10px] text-neutral-600 line-through font-bold mb-1">
                                    {formatCurrency(comparePrice!)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">Pix</span>
                            <span className="text-[10px] text-primary font-bold tracking-widest">
                                {formatCurrency(pixPrice)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
