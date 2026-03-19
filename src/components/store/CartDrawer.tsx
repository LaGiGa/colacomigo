'use client'

import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { optimizeImageUrl } from '@/lib/image'
import { Icons } from '@/components/ui/icons'
import Image from 'next/image'
import Link from 'next/link'

export function CartDrawer() {
    const { items, removeItem, updateQuantity, subtotal } = useCartStore()
    const { isCartOpen, closeCart } = useUIStore()

    return (
        <Sheet open={isCartOpen} onOpenChange={closeCart}>
            <SheetContent className="flex flex-col w-full sm:max-w-md bg-black border-l border-white/10 p-0 rounded-none sm:rounded-none">
                <SheetHeader className="p-6 border-b border-white/10">
                    <SheetTitle className="flex items-center justify-between text-white font-black tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                            <Icons.ShoppingBag className="h-5 w-5 text-primary" />
                            SACOLA
                        </div>
                        {items.length > 0 && (
                            <span className="text-xs font-bold text-neutral-500 bg-white/5 px-2 py-1">
                                {items.length} ITEM(S)
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center">
                            <Icons.ShoppingBag className="h-10 w-10 text-neutral-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-white font-bold tracking-widest uppercase">Sacola Vazia</p>
                            <p className="text-neutral-500 text-sm">Seu guarda-roupa está implorando por hype.</p>
                        </div>
                        <Button
                            onClick={closeCart}
                            className="btn-primary mt-4"
                            asChild
                        >
                            <Link href="/produtos">GARANTIR O DROP</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Lista de itens */}
                        <div className="flex-1 overflow-y-auto px-6 space-y-6 py-6">
                            {items.map((item) => (
                                <div key={item.variantId} className="flex gap-4 group">
                                    {/* Imagem - Aspect Ratio Alto / Sharp */}
                                    <div className="relative h-28 w-24 flex-shrink-0 bg-zinc-900 border border-white/5 overflow-hidden">
                                        {item.imageUrl ? (
                                            <Image
                                                src={optimizeImageUrl(item.imageUrl, { width: 320, quality: 62 }) ?? item.imageUrl}
                                                alt={item.productName}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-luminosity hover:mix-blend-normal"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Icons.ShoppingBag className="h-8 w-8 text-neutral-700" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Cortante */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <Link
                                                href={`/produtos/${item.productSlug}`}
                                                onClick={closeCart}
                                                className="text-sm font-black text-white hover:text-primary transition-colors line-clamp-2 uppercase tracking-tight leading-tight"
                                            >
                                                {item.productName}
                                            </Link>
                                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                                                {item.size && <span className="bg-white/10 px-1.5 py-0.5">{item.size}</span>}
                                                {item.colorName && <span className="bg-white/10 px-1.5 py-0.5">{item.colorName}</span>}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between">
                                            <span className="text-sm font-black text-white tracking-widest">
                                                {formatCurrency(item.price)}
                                            </span>

                                            {/* Input Quantidade Brutalista */}
                                            <div className="flex items-center bg-zinc-900 border border-white/10">
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                                    className="h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Icons.Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-xs font-bold text-white w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                                    className="h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <Icons.Plus className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.variantId)}
                                                    className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-primary/10 transition-colors border-l border-white/10"
                                                >
                                                    <Icons.Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Rodapé Neo-Brutalista */}
                        <div className="p-6 bg-zinc-950 border-t border-white/10 space-y-4">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Subtotal</span>
                                <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(subtotal())}</span>
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">
                                TAXAS E FRETE CALCULADOS NO CHECKOUT
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="btn-primary w-full"
                                    onClick={closeCart}
                                    asChild
                                >
                                    <Link href="/checkout">FINALIZAR PEDIDO</Link>
                                </Button>
                                <Button
                                    className="btn-ghost w-full"
                                    onClick={closeCart}
                                    asChild
                                >
                                    <Link href="/carrinho">VER SACOLA COMPLETA</Link>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
