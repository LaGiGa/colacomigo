'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, ShoppingBag, MessageCircle, Truck, Shield, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { toast } from 'sonner'

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
}: ProductActionsProps) {
    const addItem = useCartStore((s) => s.addItem)
    const openCart = useUIStore((s) => s.openCart)
    const [isPending, startTransition] = useTransition()

    // Separa variantes por tamanho e cor
    const sizes = [...new Set(variants.filter((v) => v.size && v.is_active).map((v) => v.size!))]
    const colors = [...new Set(variants.filter((v) => v.color_name && v.is_active).map((v) => v.color_name!))]

    const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)
    const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)
    const [quantity, setQuantity] = useState(1)

    // Encontra a variante correspondente à seleção atual
    const selectedVariant = variants.find((v) => {
        const sizeMatch = !sizes.length || v.size === selectedSize
        const colorMatch = !colors.length || v.color_name === selectedColor
        return sizeMatch && colorMatch && v.is_active
    }) ?? variants.find((v) => v.is_active)

    const currentPrice = basePrice + (selectedVariant?.price_delta ?? 0)
    const hasDiscount = comparePrice && comparePrice > basePrice
    const discountPct = hasDiscount ? Math.round(((comparePrice - basePrice) / comparePrice) * 100) : 0
    const inStock = selectedVariant && (selectedVariant.stock === undefined || selectedVariant.stock > 0)

    function handleAddToCart() {
        if (!selectedVariant) {
            toast.error('Por favor, selecione uma variante.')
            return
        }
        startTransition(() => {
            for (let i = 0; i < quantity; i++) {
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
            }
            toast.success(`${quantity}x ${productName} adicionado ao carrinho!`)
            openCart()
        })
    }

    function handleWhatsApp() {
        const sizeText = selectedSize ? ` Tamanho: ${selectedSize}.` : ''
        const colorText = selectedColor ? ` Cor: ${selectedColor}.` : ''
        const msg = `Olá! Tenho interesse no produto *${productName}*.${sizeText}${colorText} Preço: ${formatCurrency(currentPrice)}`
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    function handleRestockWhatsApp() {
        const sizeText = selectedSize ? ` no tamanho ${selectedSize}` : ''
        const msg = `Olá, vi que o produto *${productName}* esgotou${sizeText}, quando chega mais?`
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    return (
        <div className="space-y-8">
            {/* Preço Brutalista */}
            <div className="space-y-2">
                <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-[clamp(2rem,4vw,3rem)] leading-none font-black tracking-tighter text-white">{formatCurrency(currentPrice)}</span>
                    {hasDiscount && (
                        <div className="flex flex-col mb-1">
                            <span className="text-sm text-neutral-500 line-through font-bold">{formatCurrency(comparePrice!)}</span>
                            <span className="text-[10px] font-black tracking-widest text-primary uppercase mt-0.5">-{discountPct}% OFF</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1 mt-4">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                        OU 12X DE <span className="text-white">{formatCurrency(currentPrice / 12)}</span>
                    </p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-primary">
                        {formatCurrency(currentPrice * 0.95)} NO PIX
                    </p>
                </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Seletor de Cor */}
            {colors.length > 0 && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        COR <span className="text-white ml-2">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => {
                            const colorVariant = variants.find((v) => v.color_name === color)
                            return (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    title={color}
                                    className={cn(
                                        'h-10 w-10 transition-all outline outline-1 outline-offset-4',
                                        selectedColor === color ? 'outline-white' : 'outline-transparent hover:outline-white/30'
                                    )}
                                    style={{ backgroundColor: colorVariant?.color_hex ?? '#888' }}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Seletor de Tamanho */}
            {sizes.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">TAMANHO</p>
                    </div>
                    <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                        {sizes.map((size) => {
                            const sizeVariant = variants.find((v) => v.size === size && v.is_active)
                            const outOfStock = sizeVariant?.stock === 0
                            return (
                                <button
                                    key={size}
                                    disabled={outOfStock}
                                    onClick={() => setSelectedSize(size)}
                                    className={cn(
                                        'h-12 border text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center',
                                        selectedSize === size
                                            ? 'border-white bg-white text-black'
                                            : 'border-white/10 text-white hover:border-white/50 bg-black',
                                        outOfStock && 'opacity-30 cursor-not-allowed bg-[url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'100%\'><line x1=\'0\' y1=\'100%\' x2=\'100%\' y2=\'0\' stroke=\'rgba(255,255,255,0.2)\' stroke-width=\'1\'/></svg>")]'
                                    )}
                                >
                                    {size}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="flex gap-4 items-end">
                {/* Quantidade Brutalista */}
                <div className="space-y-4 w-1/3 max-w-[120px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">QTD</p>
                    <div className="flex items-center h-14 border border-white/10 bg-black">
                        <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="flex-1 h-full flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black w-10 text-center text-white">{quantity}</span>
                        <button
                            onClick={() => setQuantity((q) => q + 1)}
                            className="flex-1 h-full flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Botões de ação Brutalistas */}
                <div className="flex-1">
                    {inStock ? (
                        <Button
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={isPending}
                            className="btn-primary w-full"
                        >
                            ADICIONAR AO CARRINHO
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={handleRestockWhatsApp}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase border-0 rounded-none h-14"
                        >
                            ESGOTADO - CONSULTAR REESTOQUE
                        </Button>
                    )}
                </div>
            </div>

            <Button
                variant="outline"
                size="lg"
                onClick={handleWhatsApp}
                className="btn-ghost w-full flex items-center justify-center gap-2 border-white/10 text-white hover:border-white hover:bg-white/5"
            >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest uppercase">COMPRAR COM ATENDENTE</span>
            </Button>

            {/* Garantias */}
            <div className="grid grid-cols-3 gap-0 border border-white/10 divide-x divide-white/10 pt-0 mt-8 bg-zinc-950">
                {[
                    { icon: Truck, text: 'ENTREGA BRASIL' },
                    { icon: Shield, text: 'PAGAMENTO SEGURO' },
                    { icon: RefreshCw, text: 'TROCA EM 7 DIAS' },
                ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex flex-col items-center justify-center gap-3 text-center p-6">
                        <Icon className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
                        <span className="text-[9px] font-black tracking-widest uppercase text-neutral-400">{text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
