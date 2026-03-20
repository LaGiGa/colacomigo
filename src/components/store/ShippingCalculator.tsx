'use client'

import { useState, useEffect } from 'react'
const Loader2 = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
)
const Truck = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
)
const Zap = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
)
const Store = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
)
const Package = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
)
const CheckCircle = ({ size = 20, ...props }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
)
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
    externalCep?: string
}

export function ShippingCalculator({ weightKg = 0.3, subtotal = 0, onSelect, externalCep }: ShippingCalculatorProps) {
    const [config, setConfig] = useState<ShippingSettings | null>(null)
    const [cep, setCep] = useState('')
    const [loading, setLoading] = useState(false)
    const [configLoading, setConfigLoading] = useState(true)
    const [correiosOptions, setCorreiosOptions] = useState<ShippingOption[]>([])
    const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCorreios, setShowCorreios] = useState(false)

    // Sync com CEP externo (vindo do formulário de endereço)
    useEffect(() => {
        if (externalCep && externalCep.length === 8 && externalCep !== cep.replace(/\D/g, '')) {
            setCep(formatCepInternal(externalCep))
            // Auto-trigger calculation
            const timeout = setTimeout(() => {
                calcularCorreiosInternal(externalCep)
            }, 500)
            return () => clearTimeout(timeout)
        }
    }, [externalCep])

    // Lê configurações do admin
    useEffect(() => {
        const fallback: ShippingSettings = {
            free_shipping_enabled: true,
            free_shipping_threshold: 399,
            store_pickup_enabled: true,
            store_pickup_label: 'Retirar na Loja',
            local_delivery_enabled: true,
            local_delivery_label: 'Entrega em Palmas-TO',
            local_delivery_price: 15,
            local_delivery_days: 1,
            correios_enabled: true,
        }

        fetch('/api/store/settings')
            .then(r => r.json())
            .then(data => {
                if (data.shipping) {
                    setConfig(data.shipping)
                } else {
                    console.warn('[ShippingCalculator] No settings found, using fallback.')
                    setConfig(fallback)
                }
            })
            .catch((err) => {
                console.error('[ShippingCalculator] API error, using fallback:', err)
                setConfig(fallback)
            })
            .finally(() => setConfigLoading(false))
    }, [])

    const isFreeShipping = config?.free_shipping_enabled && subtotal >= config?.free_shipping_threshold

    // Monta opções fixas com base nas configs
    const fixedOptions: ShippingOption[] = config ? [
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
    ] : []

    function formatCepInternal(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 8)
        return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
    }

    async function calcularCorreiosInternal(forcedCep?: string) {
        const raw = (forcedCep || cep).replace(/\D/g, '')
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

    // Auto-seleciona a primeira opção disponível para não travar o usuário
    useEffect(() => {
        if (!selectedCarrier && config) {
            if (fixedOptions.length > 0) {
                handleSelect(fixedOptions[0])
            } else if (correiosOptions.length > 0) {
                handleSelect(correiosOptions[0])
            }
        }
    }, [fixedOptions.length, correiosOptions.length, selectedCarrier, config])

    if (configLoading) {
        return (
            <div className="flex items-center gap-3 py-8 text-neutral-500 border border-white/5 bg-zinc-950/50 px-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sincronizando opções de entrega...</span>
            </div>
        )
    }

    if (!config) return null

    function handleSelect(option: ShippingOption) {
        setSelectedCarrier(option.carrier)
        onSelect?.(option)
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
                            type="button"
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
                                onChange={(e) => setCep(formatCepInternal(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && calcularCorreiosInternal()}
                                maxLength={9}
                                className="flex-1 h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white transition-all text-xs font-black tracking-widest uppercase placeholder:text-neutral-600"
                            />
                            <Button
                                type="button"
                                onClick={() => calcularCorreiosInternal()}
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
                                        type="button"
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
