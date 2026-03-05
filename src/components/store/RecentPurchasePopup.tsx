'use client'

import { useEffect, useState } from 'react'
import { X, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PurchasePreview {
    name: string
    cityName: string
    timeAgo: string
    imageUrl: string | null
    productName: string
}

const DEFAULT_CITIES = ['São Paulo/SP', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Palmas/TO', 'Goiânia/GO', 'Brasília/DF', 'Curitiba/PR']
const DEFAULT_NAMES = ['João S.', 'Maria C.', 'Lucas M.', 'Ana Paula', 'Pedro H.']

export function RecentPurchasePopup() {
    const [purchases, setPurchases] = useState<PurchasePreview[]>([])
    const [index, setIndex] = useState(0)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    // Buscar configurações globais e produtos dinamicamente
    useEffect(() => {
        async function loadData() {
            const supabase = createClient()

            // 1. Pegar Nomes ficticios
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: settings } = await (supabase as any)
                .from('store_settings')
                .select('recent_purchaser_names')
                .eq('id', 1)
                .single()

            const names = settings?.recent_purchaser_names?.length
                ? settings.recent_purchaser_names
                : DEFAULT_NAMES

            // 2. Pegar alguns produtos reais que estão ativos
            const { data: products } = await supabase
                .from('products')
                .select('name, images:product_images(url)')
                .eq('is_active', true)
                .limit(10)

            if (!products || products.length === 0) return

            // 3. Gerar simulações
            const generated: PurchasePreview[] = products.map((prod) => {
                const randomName = names[Math.floor(Math.random() * names.length)]
                const randomCity = DEFAULT_CITIES[Math.floor(Math.random() * DEFAULT_CITIES.length)]
                const randomMins = Math.floor(Math.random() * 50) + 2

                return {
                    name: randomName,
                    cityName: randomCity,
                    timeAgo: `${randomMins} min`,
                    productName: prod.name,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    imageUrl: (prod.images && prod.images.length > 0) ? (prod.images as any)[0].url : null
                }
            })

            // Embaralhar
            setPurchases(generated.sort(() => Math.random() - 0.5))
        }

        loadData()
    }, [])

    useEffect(() => {
        if (dismissed || purchases.length === 0) return

        // Mostra o popup depois de 5 segundos na página
        const showTimeout = setTimeout(() => setVisible(true), 5000)
        return () => clearTimeout(showTimeout)
    }, [dismissed, purchases.length])

    useEffect(() => {
        if (!visible || dismissed || purchases.length === 0) return

        // Esconde após 5.5 segundos e avança para o próximo
        const hideTimeout = setTimeout(() => {
            setVisible(false)
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % purchases.length)
                setVisible(true)
            }, 5000) // tempo oculto entre um popup e outro
        }, 5500)

        return () => clearTimeout(hideTimeout)
    }, [visible, index, dismissed, purchases.length])

    if (dismissed || purchases.length === 0) return null

    const purchase = purchases[index]

    return (
        <div
            className={`fixed bottom-6 lg:bottom-10 left-4 lg:left-10 z-[90] w-[290px] rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                }`}
        >
            <div className="flex items-center gap-4 p-3 pr-4">
                {/* Ícone de compra em vez de foto do produto */}
                <div className="relative h-12 w-12 rounded-full flex-shrink-0 bg-white/5 flex items-center justify-center p-1 border border-white/5 shadow-inner">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <ShoppingBag className="w-5 h-5 text-white relative z-10" />
                </div>

                {/* Textos premium */}
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[9px] text-green-400 font-black tracking-widest uppercase">
                            Compra Recente
                        </p>
                    </div>
                    <p className="text-xs font-bold text-white truncate pr-2">
                        {purchase.name}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Levou <span className="text-white font-medium">{purchase.productName.length > 20 ? purchase.productName.substring(0, 20) + '...' : purchase.productName}</span>
                    </p>
                    <p className="text-[9px] text-primary/80 font-bold mt-1 tracking-wider uppercase">— {purchase.cityName}</p>
                </div>

                {/* Fechar sutil */}
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-2 right-2 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            {/* Barra de progresso vibrante */}
            <div className="h-[2px] bg-white/5 w-full">
                {visible && (
                    <div
                        className="h-full bg-primary"
                        style={{ animation: 'shrink 5.5s linear forwards' }}
                    />
                )}
            </div>
        </div>
    )
}

