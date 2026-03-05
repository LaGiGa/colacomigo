import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
            {/* 404 Gigante Brutalista */}
            <h1 className="text-[clamp(6rem,15vw,12rem)] font-black text-white leading-none tracking-tighter opacity-10 select-none">
                404
            </h1>

            <div className="relative -mt-16 sm:-mt-24">
                <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
                    DROP NÃO ENCONTRADO
                </h2>
                <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs sm:text-sm max-w-md mx-auto mb-12">
                    O link que você tentou acessar não existe ou este produto já saiu de linha. O hype é rápido demais!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="btn-primary" size="lg">
                        <Link href="/produtos">VER TODOS OS PRODUTOS</Link>
                    </Button>
                    <Button variant="outline" asChild className="btn-ghost border-white/10" size="lg">
                        <Link href="/">VOLTAR PRO INÍCIO</Link>
                    </Button>
                </div>
            </div>

            {/* Decoração Brutalista */}
            <div className="absolute top-10 left-10 text-[10px] font-black text-white/5 uppercase tracking-[1em] rotate-90 origin-left">
                COLACOMIGO / ERROR_LOG_001
            </div>
        </div>
    )
}
