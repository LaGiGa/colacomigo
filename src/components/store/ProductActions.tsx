'use client'

import { useState, useTransition } from 'react'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { toast } from 'sonner'
import { ShippingCalculator } from './ShippingCalculator'

interface Variant {
    id: string
    sku: string
    size: string | null
    color_name: string | null
    color_hex: string | null
    price_delta: number
    is_active: boolean
    stock?: number
}

interface ProductActionsProps {
    productId: string
    productName: string
    productSlug: string
    basePrice: number
    comparePrice?: number | null
    imageUrl?: string | null
    variants: Variant[]
    description?: string | null
    whatsappNumber?: string // (63) 99131-2913 da Cola Comigo
    weightKg?: number
}

export function ProductActions({
    productId,
    productName,
    productSlug,
    basePrice,
    comparePrice,
    imageUrl,
    variants,
    description,
    whatsappNumber = '5563991312913',
    weightKg = 0.3,
}: ProductActionsProps) {
    const addItem = useCartStore((s) => s.addItem)
    const openCart = useUIStore((s) => s.openCart)
    const [isPending, startTransition] = useTransition()

    // Separa variantes por tamanho e cor
    const sizes = [...new Set(variants.filter((v) => v.size && (v.is_active ?? true)).map((v) => v.size!))]
    const colors = [...new Set(variants.filter((v) => v.color_name && (v.is_active ?? true)).map((v) => v.color_name!))]

    const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)
    const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)

    const selectedVariant = variants.find((v) => {
        const sizeMatch = !sizes.length || v.size === selectedSize
        const colorMatch = !colors.length || v.color_name === selectedColor
        return sizeMatch && colorMatch && (v.is_active ?? true)
    }) ?? variants.find((v) => (v.is_active ?? true))

    const currentPrice = basePrice + (selectedVariant?.price_delta ?? 0)
    const hasDiscount = comparePrice && comparePrice > currentPrice
    const discountPct = hasDiscount ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0
    const pixPrice = currentPrice * 0.9
    const pixSavings = Math.max(0, currentPrice - pixPrice)
    const inStock = variants.length === 0
        ? true
        : !!selectedVariant && (selectedVariant.stock === undefined || selectedVariant.stock > 0)

    function handleAddToCart() {
        if (!selectedVariant) {
            toast.error('Por favor, selecione uma variante.')
            return
        }
        startTransition(() => {
            addItem({
                variantId: selectedVariant.id,
                productId,
                productName,
                productSlug,
                variantSku: selectedVariant.sku,
                size: selectedVariant.size,
                colorName: selectedVariant.color_name,
                colorHex: selectedVariant.color_hex,
                price: currentPrice,
                imageUrl: imageUrl ?? null,
            })
            toast.success(`${productName} adicionado ao carrinho!`)
            openCart()
        })
    }

    function handleWhatsApp() {
        const sizeText = selectedSize ? ` Tamanho: ${selectedSize}.` : ''
        const colorText = selectedColor ? ` Cor: ${selectedColor}.` : ''
        const msg = `Olá! Tenho interesse no produto *${productName}*.${sizeText}${colorText} Preço: ${formatCurrency(currentPrice)}`
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    return (
        <div className="space-y-10">
            {/* Preço e Parcelamento */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <span className="text-4xl font-black tracking-tighter text-white">
                        {formatCurrency(currentPrice)}
                    </span>
                    {hasDiscount && (
                        <span className="text-lg text-neutral-600 line-through font-bold">
                            {formatCurrency(comparePrice!)}
                        </span>
                    )}
                </div>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    no cartão em até <span className="text-white">12x</span> (juros do Mercado Pago podem variar)
                </p>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#1a8fff] inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a8fff] text-black text-[9px] tracking-widest">
                        <Icons.Zap className="h-3 w-3" />
                        PIX -10%
                    </span>
                    {formatCurrency(pixPrice)} no PIX
                </p>
                <p className="text-[10px] font-bold text-[#1a8fff]/85 uppercase tracking-widest">
                    economize {formatCurrency(pixSavings)} pagando no pix
                </p>
            </div>

            {/* Seletor de Cores */}
            {colors.length > 0 && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Cores Disponíveis</p>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                            const v = variants.find((v) => v.color_name === color)
                            return (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "h-10 w-10 border-2 transition-all",
                                        selectedColor === color ? "border-primary scale-110 shadow-[0_0_15px_rgba(26,143,255,0.3)]" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: v?.color_hex ?? '#333' }}
                                    title={color}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Seletor de Tamanhos (Estilo Burj) */}
            {sizes.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Selecione o Tamanho</p>
                        <button className="text-[9px] font-black tracking-widest text-primary hover:underline uppercase">Guia de Medidas</button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {sizes.map((size) => {
                            const v = variants.find((v) => v.size === size)
                            const outOfStock = v?.stock === 0
                            return (
                                <button
                                    key={size}
                                    disabled={outOfStock}
                                    onClick={() => setSelectedSize(size)}
                                    className={cn(
                                        "h-12 border flex items-center justify-center text-xs font-black transition-all",
                                        selectedSize === size
                                            ? "bg-white text-black border-white"
                                            : "bg-black text-white border-white/10 hover:border-white/40",
                                        outOfStock && "opacity-20 cursor-not-allowed"
                                    )}
                                >
                                    {size}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Botão de Compra Principal */}
            <div className="space-y-3">
                {inStock ? (
                    <Button
                        size="lg"
                        onClick={handleAddToCart}
                        disabled={isPending}
                        className="w-full h-16 bg-white text-black hover:bg-neutral-200 font-black tracking-[0.2em] text-xs transition-all rounded-none"
                    >
                        ADICIONAR AO CARRINHO
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        disabled
                        className="w-full h-16 bg-zinc-900 text-zinc-600 font-black tracking-[0.2em] text-xs rounded-none"
                    >
                        PRODUTO ESGOTADO
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={handleWhatsApp}
                    className="w-full h-14 border-white/5 bg-transparent text-white hover:bg-white/5 font-black tracking-[0.2em] text-[10px] rounded-none flex items-center gap-3"
                >
                    <Icons.MessageCircle className="h-4 w-4 text-green-500" />
                    DÚVIDAS? CHAME NO WHATSAPP
                </Button>
            </div>

            {/* Cálculo de Frete Real */}
            <div className="pt-6 border-t border-white/5">
                <ShippingCalculator weightKg={weightKg} subtotal={currentPrice} />
            </div>

            {/* Garantias Burj Style */}
            <div className="grid grid-cols-3 border-y border-white/5 divide-x divide-white/5 py-4">
                <div className="flex flex-col items-center justify-center p-2 text-center lg:px-4">
                    <Icons.Truck className="h-4 w-4 text-primary mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Frete Rápido</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 text-center lg:px-4">
                    <Icons.Shield className="h-4 w-4 text-primary mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Compra Segura</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 text-center lg:px-4">
                    <Icons.RefreshCw className="h-4 w-4 text-primary mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">7 Dias p/ Troca</span>
                </div>
            </div>
        </div>
    )
}
