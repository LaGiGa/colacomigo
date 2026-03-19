'use client'

import { useEffect, useState } from 'react'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Verifica se o usuário já aceitou
        const consent = localStorage.getItem('colacomigo_cookie_consent')
        if (!consent) {
            // Mostrar com pequeno delay para fluidez
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    function accept() {
        localStorage.setItem('colacomigo_cookie_consent', 'true')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 sm:max-w-[480px] sm:left-4 sm:bottom-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl relative">
                <div className="flex items-start gap-4">
                    <div className="text-3xl hidden sm:block">🍪</div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black tracking-tighter uppercase text-sm mb-1 line-clamp-1">Nós usamos Cookies</h3>
                        <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-sm">
                            Utilizamos cookies para personalizar sua experiência, exibir anúncios relevantes e analisar nosso tráfego. Ao continuar navegando, você concorda com nossa Política de Privacidade.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                                onClick={accept}
                                className="bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest px-6 h-9"
                            >
                                <Icons.Check className="w-3.5 h-3.5 mr-1.5" /> Entendi e Aceito
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={() => setVisible(false)}
                        className="text-[#52525b] hover:text-white transition-colors absolute top-4 right-4 sm:relative sm:top-0 sm:right-0"
                    >
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
