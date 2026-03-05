'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
            {/* 500 Gigante Brutalista */}
            <h1 className="text-[clamp(6rem,15vw,12rem)] font-black text-white leading-none tracking-tighter opacity-10 select-none">
                500
            </h1>

            <div className="relative -mt-16 sm:-mt-24">
                <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
                    DEU RUIM NO SISTEMA
                </h2>
                <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs sm:text-sm max-w-md mx-auto mb-12">
                    Tivemos um problema técnico ao carregar essa página. Tente recarregar ou volte em alguns minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => reset()} className="btn-primary" size="lg">
                        TENTAR NOVAMENTE
                    </Button>
                    <Button variant="outline" asChild className="btn-ghost border-white/10" size="lg">
                        <Link href="/">VOLTAR PRO INÍCIO</Link>
                    </Button>
                </div>
            </div>

            {/* Decoração Brutalista */}
            <div className="absolute top-10 right-10 text-[10px] font-black text-white/5 uppercase tracking-[1em] -rotate-90 origin-right">
                CRITICAL_FAILURE // ACTION_REQUIRED
            </div>
        </div>
    )
}
