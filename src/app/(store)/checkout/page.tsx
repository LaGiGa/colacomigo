import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { CheckoutFlow } from '@/components/store/CheckoutFlow'
import { Lock, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Checkout | Cola Comigo Shop',
    description: 'Finalize sua compra com segurança.',
}

export default function CheckoutPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-black py-12 lg:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    {/* Header Brutalista */}
                    <div className="text-center mb-12 border-b border-white/5 pb-12">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            <span className="text-[10px] font-black tracking-widest text-green-500 uppercase">AMBIENTE 100% SEGURO</span>
                        </div>
                        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black tracking-tighter leading-none text-white uppercase">Checkout</h1>
                        <p className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase mt-4">
                            DADOS CRIPTOGRAFADOS DE PONTA A PONTA
                        </p>
                    </div>

                    {/* Steps indicator */}
                    <div className="flex items-center justify-center gap-2 mb-12 text-[9px] font-black tracking-widest text-neutral-600 uppercase">
                        {['CARRINHO', 'ENDEREÇO', 'PAGAMENTO', 'SUCESSO'].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 border border-white/10 flex items-center justify-center bg-zinc-950 text-white">
                                        {i + 1}
                                    </div>
                                    <span className={i === 1 ? 'text-white' : ''}>{s}</span>
                                </div>
                                {i < 3 && <div className="h-px w-8 bg-white/5" />}
                            </div>
                        ))}
                    </div>

                    {/* Checkout Flow Container */}
                    <div className="border border-white/10 bg-zinc-950 p-6 sm:p-10">
                        <CheckoutFlow />
                    </div>

                    {/* Selos de segurança */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[9px] font-black tracking-widest text-neutral-500 uppercase">
                        <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> SSL 256 BITS</span>
                        <span className="flex items-center gap-1.5">💳 MERCADO PAGO</span>
                        <span className="flex items-center gap-1.5">📦 CORREIOS</span>
                        <span className="flex items-center gap-1.5 text-green-500">✅ COMPRA GARANTIDA</span>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </>
    )
}
