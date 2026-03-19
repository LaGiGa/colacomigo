'use client'

import { useEffect } from 'react'
import { ShoppingBag } from '@/components/ui/icons'
import { useUIStore } from '@/store/useUIStore'

// Abre a sacola automaticamente e exibe a página
export default function CarrinhoPage() {
    const { openCart } = useUIStore()

    useEffect(() => {
        // Abre a Sidebar da sacola automaticamente
        openCart()
    }, [openCart])

    return (
        <main className="min-h-[60vh] bg-black flex flex-col items-center justify-center px-4">
            <div className="text-center">
                <ShoppingBag className="h-16 w-16 text-neutral-700 mx-auto mb-6" />
                <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-3">Sua Sacola</h1>
                <p className="text-neutral-500 text-sm">
                    A sacola abrirá automaticamente. Caso não abra,{' '}
                    <button
                        onClick={openCart}
                        className="text-primary hover:underline font-bold"
                    >
                        clique aqui
                    </button>
                    .
                </p>
            </div>
        </main>
    )
}
