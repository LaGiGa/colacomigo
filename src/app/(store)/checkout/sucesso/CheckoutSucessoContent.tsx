'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle, Package } from '@/components/ui/icons'
import Link from 'next/link'

export function CheckoutSucessoContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('order_id')
    const { clearCart } = useCartStore()

    useEffect(() => {
        clearCart()
    }, [clearCart])

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl" />
                    <CheckCircle className="relative h-20 w-20 text-green-400 mx-auto" />
                </div>

                <div>
                    <h1 className="text-3xl font-black text-primary">Pedido Confirmado!</h1>
                    <p className="text-muted-foreground mt-2">
                        Recebemos seu pedido e estamos preparando tudo com carinho.
                    </p>
                    {orderId && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Nº do pedido:{' '}
                            <span className="font-mono font-bold text-foreground">
                                {orderId.slice(0, 8).toUpperCase()}
                            </span>
                        </p>
                    )}
                </div>

                <div className="glass rounded-xl p-4 text-sm text-left space-y-2">
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <Package className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>
                            Você receberá um e-mail com a confirmação e o código de rastreamento.
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="gradient-brand text-white" asChild>
                        <Link href="/produtos">Continuar Comprando</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/conta/pedidos">Meus Pedidos</Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Dúvidas? WhatsApp:{' '}
                    <a href="https://wa.me/5563991312913" className="text-green-400 hover:underline">
                        (63) 99131-2913
                    </a>
                </p>
            </div>
        </main>
    )
}
