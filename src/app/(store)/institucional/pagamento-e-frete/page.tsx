import { CreditCard, Smartphone, BarChart, Truck, Package, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meios de Pagamento e Frete | Cola Comigo Shop',
    description: 'Conheça as formas de pagamento aceitas e nossas opções de entrega para todo o Brasil.',
}

const PAGAMENTOS = [
    {
        icon: Smartphone,
        titulo: 'PIX',
        descricao: 'Pagamento instantâneo com aprovação imediata. Disponível 24h por dia, 7 dias por semana.',
        destaque: 'Mais rápido',
    },
    {
        icon: CreditCard,
        titulo: 'Cartão de Crédito',
        descricao: 'Visa, Mastercard, Elo, Hipercard e American Express. Parcelamento em até 12x com juros.',
        destaque: 'Até 12x',
    },
    {
        icon: BarChart,
        titulo: 'Boleto Bancário',
        descricao: 'Vencimento em 3 dias úteis. O pedido é processado após a confirmação do pagamento.',
        destaque: '3 dias úteis',
    },
]

const FRETES = [
    {
        icon: MapPin,
        titulo: 'Entrega Relâmpago',
        descricao: 'Exclusivo para Palmas-TO. Receba seu drop via motoboy no mesmo dia (para pedidos confirmados até as 14h).',
        prazo: 'Mesmo dia',
    },
    {
        icon: Truck,
        titulo: 'SEDEX — Correios',
        descricao: 'Entrega expressa para todo território nacional. Prazo médio de 2 a 5 dias úteis.',
        prazo: '2–5 dias úteis',
    },
    {
        icon: Package,
        titulo: 'PAC — Correios',
        descricao: 'Entrega econômica para todo o Brasil. Prazo médio de 7 a 15 dias úteis após postagem.',
        prazo: '7–15 dias úteis',
    },
]

export default function PagamentoEFretePage() {
    return (
        <main className="min-h-screen bg-black">
            {/* Hero */}
            <div className="border-b border-white/5 py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">
                        Institucional
                    </p>
                    <h1 className="text-[clamp(2rem,6vw,4rem)] font-black tracking-tighter uppercase leading-none mb-4">
                        Pagamento & Frete
                    </h1>
                    <p className="text-neutral-400 text-base max-w-xl mx-auto">
                        Trabalhamos com os meios de pagamento mais seguros do mercado e as principais transportadoras para garantir que seu pedido chegue com rapidez.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

                {/* Meios de pagamento */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                        Meios de Pagamento
                    </h2>
                    <p className="text-neutral-500 text-sm mb-8">
                        Todos os pagamentos são processados pela plataforma Mercado Pago, com proteção antifraude nativa.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {PAGAMENTOS.map(({ icon: Icon, titulo, descricao, destaque }) => (
                            <div
                                key={titulo}
                                className="bg-zinc-950 border border-white/8 p-6 relative group hover:border-primary/30 transition-all"
                            >
                                <span className="absolute top-4 right-4 text-[9px] font-black tracking-widest uppercase text-primary/70 border border-primary/20 px-2 py-0.5">
                                    {destaque}
                                </span>
                                <div className="h-10 w-10 bg-primary/10 flex items-center justify-center mb-4">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-black uppercase tracking-tight mb-2">{titulo}</h3>
                                <p className="text-sm text-neutral-500 leading-relaxed">{descricao}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 border border-primary/20 bg-primary/5">
                        <p className="text-sm text-neutral-300 leading-relaxed">
                            <span className="font-black text-primary">Segurança garantida:</span> Utilizamos criptografia SSL em todas as transações. Seus dados bancários nunca são armazenados em nossos servidores.
                        </p>
                    </div>
                </section>

                {/* Frete e Entregas */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                        Opções de Entrega
                    </h2>
                    <p className="text-neutral-500 text-sm mb-8">
                        Enviamos para todo o Brasil via Correios. O prazo começa a contar após a confirmação do pagamento e separação do pedido (1–2 dias úteis).
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {FRETES.map(({ icon: Icon, titulo, descricao, prazo }) => (
                            <div
                                key={titulo}
                                className="bg-zinc-950 border border-white/8 p-6 relative hover:border-white/15 transition-all"
                            >
                                <div className="h-10 w-10 bg-white/5 flex items-center justify-center mb-4">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="font-black uppercase tracking-tight mb-1">{titulo}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{prazo}</p>
                                <p className="text-sm text-neutral-500 leading-relaxed">{descricao}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 space-y-3 text-sm text-neutral-400 leading-relaxed">
                        <p>• <span className="text-primary font-bold">FRETE GRÁTIS:</span> Disponível via PAC em compras acima de R$ 399,00 para todo o Brasil.</p>
                        <p>• O rastreamento do pedido é enviado por e-mail assim que o produto for postado.</p>
                        <p>• Os prazos de entrega são estimativas dos Correios e podem variar de acordo com a região e demanda.</p>
                        <p>• Em caso de atraso ou extravio, entre em contato pelo WhatsApp: <span className="text-primary font-bold">(63) 99131-2913</span></p>
                        <p>• Não realizamos entregas em finais de semana e feriados.</p>
                    </div>
                </section>
            </div>
        </main>
    )
}
