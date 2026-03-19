'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/store/useCartStore'
import { PaymentBrick } from '@/components/store/PaymentBrick'
import { ShippingCalculator } from '@/components/store/ShippingCalculator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { optimizeImageUrl } from '@/lib/image'
import { Check, CheckCircle, CheckCircle2, ChevronLeft, Copy, CreditCard, Loader2, Lock, MapPin, ShoppingBag, Truck } from '@/components/ui/icons'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

const AddressSchema = z.object({
    name: z.string().min(3, 'Nome completo obrigatório'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'Telefone com DDD obrigatório'),
    zipCode: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    street: z.string().min(3, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    city: z.string().min(2, 'Cidade obrigatória'),
    state: z.string().length(2, 'UF deve ter 2 letras').toUpperCase(),
})

type AddressForm = z.infer<typeof AddressSchema>

type Step = 'cart' | 'address' | 'payment' | 'success'

interface ShippingOption {
    serviceName: string
    carrier: string
    price: number
    estimatedDays: number
}

interface PendingPaymentData {
    paymentId: string
    status: string
    pixQrCode?: string | null
    pixQrCodeBase64?: string | null
}

export function CheckoutFlow() {
    const router = useRouter()
    const { items, subtotal, clearCart } = useCartStore()
    const [step, setStep] = useState<Step>('cart')
    const [shipping, setShipping] = useState<ShippingOption | null>(null)
    const [preferenceId, setPreferenceId] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [pendingPayment, setPendingPayment] = useState<PendingPaymentData | null>(null)

    // Coupon states
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string
        code: string
        discount_type: 'percent' | 'fixed'
        discount_value: number
    } | null>(null)
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

    const calculateDiscount = () => {
        if (!appliedCoupon) return 0
        if (appliedCoupon.discount_type === 'fixed') return appliedCoupon.discount_value
        return (subtotal() * appliedCoupon.discount_value) / 100
    }

    const [user, setUser] = useState<User | null>(null)
    const supabase = useMemo(() => createClient(), [])

    const discountValue = calculateDiscount()

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })
    }, [supabase])

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid },
    } = useForm<AddressForm>({
        resolver: zodResolver(AddressSchema),
        mode: 'onChange',
        defaultValues: {
            email: user?.email || '',
            name: user?.user_metadata?.display_name || '',
        }
    })

    // Pre-fill user data when it becomes available
    useEffect(() => {
        if (user) {
            setValue('email', user.email || '')
            if (user.user_metadata?.display_name) {
                setValue('name', user.user_metadata.display_name)
            }
        }
    }, [user, setValue])

    const orderTotal = Number(Math.max(0, subtotal() + (shipping?.price ?? 0) - discountValue).toFixed(2))
    const validItems = items.filter((i) => i.quantity > 0)

    // Auto-preenche endereço via ViaCEP
    async function autoFillAddress(cep: string) {
        const raw = cep.replace(/\D/g, '')
        if (raw.length !== 8) return
        try {
            const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
            const data = await res.json()
            if (!data.erro) {
                setValue('street', data.logradouro)
                setValue('neighborhood', data.bairro)
                setValue('city', data.localidade)
                setValue('state', data.uf)
            }
        } catch { /* silencioso */ }
    }

    function handlePaymentSuccess(paymentId: string) {
        setPendingPayment(null)
        clearCart()
        setStep('success')
        toast.success('Pagamento aprovado! 🎉')
    }

    function handlePendingPayment(payload: PendingPaymentData) {
        setPendingPayment(payload)
        toast.info('PIX gerado! Escaneie o QR Code ou copie o codigo para pagar.')
    }

    async function copyPixCode() {
        if (!pendingPayment?.pixQrCode) return
        try {
            await navigator.clipboard.writeText(pendingPayment.pixQrCode)
            toast.success('Codigo PIX copiado!')
        } catch {
            toast.error('Nao foi possivel copiar o codigo PIX.')
        }
    }

    // Validação de Cupom
    async function handleApplyCoupon() {
        if (!couponCode.trim()) return
        setIsValidatingCoupon(true)
        try {
            const res = await fetch('/api/checkout/coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, total: subtotal() })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            const { coupon } = result
            setAppliedCoupon({
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type === 'percent' ? 'percent' : 'fixed',
                discount_value: coupon.discount_value
            })
            toast.success(`Cupom ${coupon.code} aplicado!`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao validar cupom')
            setAppliedCoupon(null)
        } finally {
            setIsValidatingCoupon(false)
        }
    }

    async function onAddressSubmit(data: AddressForm) {
        if (!shipping) {
            toast.error('Selecione uma opção de frete antes de continuar.')
            return
        }

        setLoading(true)
        try {
            // Cria o pedido + preference no Supabase e MP
            const res = await fetch('/api/checkout/preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: validItems.map((i) => ({
                        variant_id: i.variantId,
                        name: i.productName,
                        quantity: i.quantity,
                        price: i.price,
                    })),
                    customer: {
                        ...data,
                        zipCode: data.zipCode.replace(/\D/g, '')
                    },
                    shipping: {
                        name: shipping.serviceName,
                        price: shipping.price
                    },
                    coupon: appliedCoupon ? {
                        id: appliedCoupon.id,
                        code: appliedCoupon.code,
                        discount_type: appliedCoupon.discount_type,
                        discount_value: appliedCoupon.discount_value
                    } : null
                }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            setPreferenceId(result.id)
            setOrderId(result.orderId)
            setStep('payment')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao criar pedido')
        } finally {
            setLoading(false)
        }
    }

    function handlePaymentError(err: Error) {
        toast.error('Erro no pagamento: ' + err.message)
        setLoading(false)
    }

    // ─── POLLING: CHECK ORDER STATUS ──────────────────────────────────
    useEffect(() => {
        let interval: any
        
        if (step === 'payment' && orderId && pendingPayment) {
            console.log('Iniciando polling para pedido via API interna:', orderId)
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/checkout/order-status?orderId=${orderId}`)
                    if (!response.ok) {
                        console.error('Erro ao consultar API de status:', response.statusText)
                        return
                    }

                    const data = await response.json()

                    if (data?.status === 'paid') {
                        clearInterval(interval)
                        handlePaymentSuccess(pendingPayment.paymentId)
                        return
                    }

                    if (data?.status === 'cancelled' || data?.status === 'refunded' || data?.mp_status === 'rejected') {
                        clearInterval(interval)
                        setPendingPayment(null)
                        toast.error('O pagamento foi recusado ou o pedido foi cancelado.')
                    }
                } catch (e) {
                    console.error('Falha ao checar status do pedido:', e)
                }
            }, 5000) // check every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [step, orderId, pendingPayment])
    
    // ─── STEP: CART ───────────────────────────────────────────────────
    if (step === 'cart') {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-white" />
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">REVISAR PEDIDO</h2>
                    </div>
                    <Badge className="bg-white/10 text-white border-0 font-bold tracking-widest text-[10px] uppercase rounded-none px-3 py-1">
                        {validItems.length} ITEM{validItems.length !== 1 ? 'S' : ''}
                    </Badge>
                </div>

                {validItems.length === 0 ? (
                    <div className="text-center py-12 border border-white/5 bg-zinc-950">
                        <p className="text-[10px] font-black tracking-widest uppercase text-neutral-500">O SEU CARRINHO ESTÁ VAZIO.</p>
                        <Button className="btn-primary mt-6" onClick={() => router.push('/produtos')}>IR PARA A COLEÇÃO</Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-0 border-y border-white/10 divide-y divide-white/10">
                            {validItems.map((item) => (
                                <div key={item.variantId} className="flex gap-4 p-4 bg-black hover:bg-zinc-950 transition-colors">
                                    {item.imageUrl && (
                                        <div className="relative h-20 w-16 overflow-hidden flex-shrink-0 bg-neutral-900 outline outline-1 outline-white/10">
                                            <Image
                                                src={optimizeImageUrl(item.imageUrl, { width: 220, quality: 60 }) ?? item.imageUrl}
                                                alt={item.productName}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <p className="font-black text-xs uppercase tracking-widest line-clamp-1 text-white">{item.productName}</p>
                                            {(item.size || item.colorName) && (
                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                                                    {[item.size, item.colorName].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-end justify-between mt-2">
                                            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-600">QTD {item.quantity}</span>
                                            <span className="font-black text-white text-sm tracking-widest">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 py-6 border-y border-white/10">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">POSSUI UM CUPOM?</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="CÓDIGO"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="h-10 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs"
                                />
                                <Button
                                    type="button"
                                    disabled={isValidatingCoupon || !couponCode}
                                    onClick={handleApplyCoupon}
                                    className="btn-ghost h-10 px-6 text-[10px] font-black tracking-widest bg-white/5 hover:bg-white/10"
                                >
                                    {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APLICAR'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 text-[10px] font-black tracking-widest uppercase">
                            <div className="flex justify-between text-neutral-400">
                                <span>Subtotal</span>
                                <span className="text-white">{formatCurrency(subtotal())}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-500">
                                    <span>DESCONTO ({appliedCoupon.code})</span>
                                    <span>-{formatCurrency(discountValue)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-neutral-400">
                                <span>Frete</span>
                                <span className="text-white">{shipping ? formatCurrency(shipping.price) : 'CALCULADO NA PRÓXIMA ETAPA'}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-4 border-t border-white/10 text-white">
                                <span>TOTAL</span>
                                <span className="text-primary font-black">{formatCurrency(orderTotal)}</span>
                            </div>
                        </div>

                        <Button
                            className="btn-primary w-full h-14 text-xs mt-4 group"
                            onClick={() => {
                                if (!user) {
                                    toast('Identificação Necessária', {
                                        description: 'Para sua segurança, por favor entre na sua conta ou crie uma para finalizar a compra.',
                                        action: {
                                            label: 'ENTRAR',
                                            onClick: () => router.push('/login?redirect=/checkout')
                                        },
                                    })
                                    router.push('/login?redirect=/checkout')
                                    return
                                }
                                setStep('address')
                            }}
                        >
                            {user ? 'AVANÇAR PARA ENTREGA' : (
                                <>
                                    <Lock className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                    ENTRAR PARA FINALIZAR
                                </>
                            )}
                        </Button>

                        {user && (
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center mt-4">
                                LOGADO COMO: <span className="text-primary">{user.email}</span>
                            </p>
                        )}
                    </>
                )}
            </div>
        )
    }

    // ─── STEP: ADDRESS ────────────────────────────────────────────────
    if (step === 'address') {
        return (
            <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-8">
                <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                    <button type="button" onClick={() => setStep('cart')} className="text-neutral-500 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <MapPin className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">DADOS DE ENVIO</h2>
                </div>

                {/* Dados pessoais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">NOME E SOBRENOME *</Label>
                        <Input {...register('name')} placeholder="Digite seu nome completo" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.name && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">E-MAIL *</Label>
                        <Input {...register('email')} type="email" placeholder="seu@email.com" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.email && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">WHATSAPP / TELEFONE *</Label>
                        <Input {...register('phone')} placeholder="(XX) XXXXX-XXXX" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.phone && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.phone.message}</p>}
                    </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Endereço */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CEP *</Label>
                        <Input
                            {...register('zipCode')}
                            placeholder="00000-000"
                            maxLength={9}
                            className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs"
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '')
                                setValue('zipCode', raw, { shouldValidate: true })
                                if (raw.length === 8) autoFillAddress(raw)
                            }}
                        />
                        {errors.zipCode && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.zipCode.message}</p>}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">RUA / AVENIDA *</Label>
                        <Input {...register('street')} placeholder="Nome da rua" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.street && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.street.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">NÚMERO *</Label>
                        <Input {...register('number')} placeholder="Ex: 123" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.number && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.number.message}</p>}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">COMPLEMENTO</Label>
                        <Input {...register('complement')} placeholder="Apto, Bloco, Casa 2..." className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">BAIRRO *</Label>
                        <Input {...register('neighborhood')} placeholder="Seu bairro" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.neighborhood && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.neighborhood.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CIDADE *</Label>
                        <Input {...register('city')} placeholder="Sua cidade" className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-wider text-xs" />
                        {errors.city && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">UF *</Label>
                        <Input {...register('state')} placeholder="TO" maxLength={2} className="h-12 border-white/10 bg-black text-white rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white transition-all uppercase tracking-widest text-xs uppercase" />
                        {errors.state && <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.state.message}</p>}
                    </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Frete */}
                <ShippingCalculator
                    weightKg={0.5}
                    subtotal={subtotal()}
                    externalCep={watch('zipCode')}
                    onSelect={(opt) => setShipping(opt)}
                />

                {/* Resumo */}
                <div className="border border-white/10 bg-black p-6 space-y-3 text-[10px] font-black tracking-widest uppercase mt-8">
                    <div className="flex justify-between text-neutral-400">
                        <span>SUBTOTAL</span>
                        <span className="text-white">{formatCurrency(subtotal())}</span>
                    </div>
                    {appliedCoupon && (
                        <div className="flex justify-between text-green-500">
                            <span>DESCONTO ({appliedCoupon.code})</span>
                            <span>-{formatCurrency(discountValue)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-neutral-400">
                        <span>FRETE ({shipping?.serviceName ?? 'PENDENTE'})</span>
                        <span className="text-white">{shipping ? formatCurrency(shipping.price) : '0,00'}</span>
                    </div>
                    <div className="h-px w-full bg-white/10 my-2" />
                    <div className="flex justify-between text-sm text-white">
                        <span>TOTAL</span>
                        <span className="text-primary">{formatCurrency(orderTotal)}</span>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading || !shipping}
                    className="btn-primary w-full h-14 mt-4 text-xs"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : !shipping ? (
                        <Truck className="h-4 w-4 mr-2" />
                    ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {!shipping ? 'ESCOLHA UMA OPÇÃO DE FRETE' : 'IR PARA PAGAMENTO'}
                </Button>
            </form>
        )
    }

    // ─── STEP: PAYMENT ────────────────────────────────────────────────
    if (step === 'payment' && preferenceId) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                    <button onClick={() => setStep('address')} className="text-neutral-500 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <CreditCard className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">REVISÃO E PAGAMENTO</h2>
                </div>

                {/* Resumo final */}
                <div className="border border-white/10 bg-black p-6">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{validItems.length} ITEM{validItems.length !== 1 ? 'S' : ''} + FRETE</p>
                        {discountValue > 0 && (
                            <Badge className="bg-green-500/10 text-green-500 border-0 font-bold tracking-widest text-[9px] uppercase rounded-none">
                                -{formatCurrency(discountValue)} DESC.
                            </Badge>
                        )}
                    </div>
                    <p className="font-black tracking-tighter text-white text-[clamp(1.5rem,3vw,2.5rem)] leading-none mt-1">{formatCurrency(orderTotal)}</p>
                </div>

                {/* Payment Brick */}
                <div className="pt-4">
                    {pendingPayment && (
                        <div className="mb-6 border border-primary/30 bg-primary/5 p-5 space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Pagamento PIX pendente</p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                                Escaneie o QR Code abaixo ou use o codigo copia e cola.
                            </p>
                            {pendingPayment.pixQrCodeBase64 && (
                                <div className="bg-white p-3 inline-block">
                                    <Image
                                        src={`data:image/png;base64,${pendingPayment.pixQrCodeBase64}`}
                                        alt="QR Code PIX"
                                        width={220}
                                        height={220}
                                        className="h-[220px] w-[220px]"
                                    />
                                </div>
                            )}
                            {pendingPayment.pixQrCode && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                        PIX copia e cola
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={pendingPayment.pixQrCode}
                                            className="h-10 border-white/10 bg-black text-white rounded-none text-[10px] font-bold tracking-wide"
                                        />
                                        <Button type="button" className="btn-primary h-10 px-4" onClick={copyPixCode}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            COPIAR
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                Apos o pagamento, a confirmacao acontece automaticamente.
                            </p>
                        </div>
                    )}
                    <PaymentBrick
                        preferenceId={preferenceId}
                        orderId={orderId!}
                        totalAmount={orderTotal}
                        onSuccess={handlePaymentSuccess}
                        onPendingPayment={handlePendingPayment}
                        onError={handlePaymentError}
                    />
                </div>
            </div>
        )
    }

    // ─── STEP: SUCCESS ────────────────────────────────────────────────
    if (step === 'success') {
        return (
            <div className="text-center space-y-8 py-16">
                <div className="text-8xl animate-bounce">📦</div>
                <div>
                    <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black uppercase tracking-tighter text-white leading-none">PEDIDO CONFIRMADO</h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mt-4 max-w-sm mx-auto">
                        AGUARDAMOS O PROCESSAMENTO NA REDE. VOCÊ RECEBERÁ UM COMPROVANTE POR E-MAIL.
                    </p>
                    {orderId && (
                        <div className="inline-block mt-6 border border-white/10 bg-black px-6 py-4">
                            <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1">NÚMERO DO PEDIDO:</p>
                            <p className="font-mono font-black text-white text-xl">{orderId.slice(0, 8).toUpperCase()}</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Button className="btn-primary" onClick={() => router.push('/produtos')}>
                        CONTINUAR EXPLORANDO
                    </Button>
                    <Button className="btn-ghost" onClick={() => router.push('/conta/pedidos')}>
                        MEUS PEDIDOS
                    </Button>
                </div>
            </div>
        )
    }

    return null
}
