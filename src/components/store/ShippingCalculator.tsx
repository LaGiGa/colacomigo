'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, Store, Truck, Package, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface ShippingOption {
    serviceName: string
    carrier: 'store_pickup' | 'palmas_local' | 'pac' | 'sedex'
    price: number
    estimatedDays: number
    icon: 'store' | 'moto' | 'truck'
}

interface ShippingSettings {
    free_shipping_enabled: boolean
    free_shipping_threshold: number
    store_pickup_enabled: boolean
    store_pickup_label: string
    local_delivery_enabled: boolean
    local_delivery_label: string
    local_delivery_price: number
    local_delivery_days: number
    correios_enabled: boolean
}

interface ShippingCalculatorProps {
    weightKg?: number
    subtotal?: number
    onSelect?: (option: ShippingOption) => void
}

export function ShippingCalculator({ weightKg = 0.3, subtotal = 0, onSelect }: ShippingCalculatorProps) {
    const [config, setConfig] = useState<ShippingSettings | null>(null)
    const [cep, setCep] = useState('')
    const [loading, setLoading] = useState(false)
    const [configLoading, setConfigLoading] = useState(true)
    const [correiosOptions, setCorreiosOptions] = useState<ShippingOption[]>([])
    const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCorreios, setShowCorreios] = useState(false)

    // Lê configurações do admin
    useEffect(() => {
        fetch('/api/admin/shipping-settings')
            .then(r => r.json())
            .then(data => {
                if (data.settings) setConfig(data.settings)
            })
            .catch(() => {
                // Fallback com valores padrão se a API falhar
                setConfig({
                    free_shipping_enabled: true,
                    free_shipping_threshold: 399,
                    store_pickup_enabled: true,
                    store_pickup_label: 'Retirar na Loja',
                    local_delivery_enabled: true,
                    local_delivery_label: 'Entrega em Palmas-TO',
                    local_delivery_price: 15,
                    local_delivery_days: 1,
                    correios_enabled: true,
                })
            })
            .finally(() => setConfigLoading(false))
    }, [])

    if (!config) return null

    const isFreeShipping = config.free_shipping_enabled && subtotal >= config.free_shipping_threshold

    // Monta opções fixas com base nas configs
    const fixedOptions: ShippingOption[] = [
        ...(config.store_pickup_enabled ? [{
            serviceName: config.store_pickup_label,
            carrier: 'store_pickup' as const,
            price: 0,
            estimatedDays: 0,
            icon: 'store' as const,
        }] : []),
        ...(config.local_delivery_enabled ? [{
            serviceName: config.local_delivery_label,
            carrier: 'palmas_local' as const,
            price: config.local_delivery_price,
            estimatedDays: config.local_delivery_days,
            icon: 'moto' as const,
        }] : []),
    ]

    function formatCep(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 8)
        return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
    }

    async function calcularCorreios() {
        const raw = cep.replace(/\D/g, '')
        if (raw.length !== 8) {
            setError('Digite um CEP válido com 8 dígitos.')
            return
        }

        setLoading(true)
        setError(null)
        setCorreiosOptions([])

        try {
            const res = await fetch('/api/checkout/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cepDestino: raw, itens: [{ quantity: 1, weightKg }] }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error ?? 'Erro ao calcular frete.')
            }

            const data = await res.json()
            const mapped: ShippingOption[] = (data.options as {
                serviceName: string; carrier: string; price: number; estimatedDays: number
            }[]).map((o) => ({
                ...o,
                // Zera preço dos Correios se frete grátis ativo
                price: isFreeShipping ? 0 : o.price,
                carrier: o.carrier as ShippingOption['carrier'],
                icon: 'truck' as const,
            }))
            setCorreiosOptions(mapped)
            setShowCorreios(true)

            // Auto-seleciona PAC grátis
            if (isFreeShipping && mapped.length > 0) {
                const pac = mapped.find(o => (o.carrier as string).includes('pac')) ?? mapped[0]
                handleSelect(pac)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao calcular frete.')
        } finally {
            setLoading(false)
        }
    }

    function handleSelect(option: ShippingOption) {
        setSelectedCarrier(option.carrier)
        onSelect?.(option)
    }

    if (configLoading) {
        return (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Carregando opções de entrega...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <Truck className="h-4 w-4 text-green-500" />
                OPÇÕES DE ENTREGA
            </p>

            {/* Banner frete grátis */}
            {isFreeShipping && (
                <div className="flex items-center gap-3 border border-green-500/30 bg-green-500/10 p-4">
                    <Zap className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="font-black text-xs tracking-widest uppercase text-green-400">FRETE GRÁTIS CONQUISTADO! 🎉</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-green-500/70 mt-0.5">
                            Compras acima de {formatCurrency(config.free_shipping_threshold)} têm frete grátis via Correios (PAC)
                        </p>
                    </div>
                </div>
            )}

            {/* Opções fixas */}
            {fixedOptions.length > 0 && (
                <div className="space-y-3">
                    {fixedOptions.map((opt) => (
                        <button
                            key={opt.carrier}
                            onClick={() => handleSelect(opt)}
                            className={cn(
                                'w-full flex items-center gap-4 p-4 border transition-all text-left bg-zinc-950',
                                selectedCarrier === opt.carrier
                                    ? 'border-white outline outline-1 outline-white outline-offset-1'
                                    : 'border-white/10 hover:border-white/40'
                            )}
                        >
                            <div className={cn(
                                'h-10 w-10 border border-white/10 bg-black flex items-center justify-center flex-shrink-0',
                                opt.carrier === 'store_pickup' ? 'text-blue-500' : 'text-orange-500'
                            )}>
                                {opt.carrier === 'store_pickup'
                                    ? <Store className="h-5 w-5" />
                                    : <Package className="h-5 w-5" />
                                }
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-xs tracking-widest uppercase text-white">{opt.serviceName}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
                                    {opt.carrier === 'store_pickup'
                                        ? 'CONFIRMAÇÃO VIA WHATSAPP'
                                        : opt.estimatedDays === 0
                                            ? 'MESMO DIA (COMBINAR HORÁRIO)'
                                            : `${opt.estimatedDays} DIA(S) ÚTIL(IS)`
                                    }
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end">
                                {opt.price === 0
                                    ? <span className="font-black text-green-500 text-sm tracking-widest uppercase">GRÁTIS</span>
                                    : <span className="font-black text-white text-sm tracking-widest">{formatCurrency(opt.price)}</span>
                                }
                            </div>
                            {selectedCarrier === opt.carrier && (
                                <CheckCircle className="h-4 w-4 text-white flex-shrink-0 ml-3" strokeWidth={3} />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Calculadora Correios */}
            {config.correios_enabled && (
                <>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-600">
                        <div className="flex-1 h-px bg-white/5" />
                        <span>OU CORREIOS (NACIONAL)</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="CEP (apenas números)"
                                value={cep}
                                onChange={(e) => setCep(formatCep(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && calcularCorreios()}
                                maxLength={9}
                                className="flex-1 h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white transition-all text-xs font-black tracking-widest uppercase placeholder:text-neutral-600"
                            />
                            <Button
                                onClick={calcularCorreios}
                                disabled={loading}
                                variant="outline"
                                className="flex-shrink-0 h-12 rounded-none border-white/10 bg-black text-white hover:bg-white/10 hover:text-white text-xs font-black uppercase tracking-widest px-6 w-32"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CALCULAR'}
                            </Button>
                        </div>

                        {error && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{error}</p>}

                        {showCorreios && correiosOptions.length > 0 && (
                            <div className="space-y-3">
                                {correiosOptions.map((opt) => (
                                    <button
                                        key={opt.carrier}
                                        onClick={() => handleSelect(opt)}
                                        className={cn(
                                            'w-full flex items-center gap-4 p-4 border transition-all text-left bg-zinc-950',
                                            selectedCarrier === opt.carrier
                                                ? 'border-white outline outline-1 outline-white outline-offset-1'
                                                : 'border-white/10 hover:border-white/40'
                                        )}
                                    >
                                        <div className="h-10 w-10 border border-white/10 bg-black flex items-center justify-center flex-shrink-0 text-white">
                                            <Truck className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-xs tracking-widest uppercase text-white">{opt.serviceName}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
                                                {opt.estimatedDays} DIAS ÚTEIS
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {opt.price === 0
                                                ? <span className="font-black text-green-500 text-sm tracking-widest uppercase">GRÁTIS</span>
                                                : <span className="text-white font-black tracking-widest text-sm">{formatCurrency(opt.price)}</span>
                                            }
                                        </div>
                                        {selectedCarrier === opt.carrier && (
                                            <CheckCircle className="h-4 w-4 text-white flex-shrink-0 ml-3" strokeWidth={3} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                            NÃO SABE SEU CEP?{' '}
                            <a
                                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:underline"
                            >
                                BUSCAR NOS CORREIOS
                            </a>
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
