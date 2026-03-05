import { Suspense } from 'react'
import { CheckoutSucessoContent } from './CheckoutSucessoContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pedido Confirmado | Cola Comigo Shop',
}

export default function CheckoutSucessoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm">Confirmando seu pedido...</p>
                </div>
            </div>
        }>
            <CheckoutSucessoContent />
        </Suspense>
    )
}
