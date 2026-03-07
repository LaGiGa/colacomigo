import { RefreshCw, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Trocas e Devoluções | Cola Comigo Shop',
    description: 'Entenda como funciona nossa política de trocas e devoluções. Processo simples e transparente.',
}

const PRAZOS = [
    {
        icon: Clock,
        titulo: 'Arrependimento',
        prazo: '7 dias corridos',
        descricao: 'Você tem 7 dias corridos a partir do recebimento para solicitar a devolução por arrependimento, sem precisar justificar o motivo.',
        cor: 'text-blue-400',
        bg: 'bg-blue-400/10',
    },
    {
        icon: RefreshCw,
        titulo: 'Defeito de Fabricação',
        prazo: 'Até 90 dias',
        descricao: 'Produtos com vício ou defeito de fabricação podem ser trocados em até 90 dias corridos após o recebimento.',
        cor: 'text-orange-400',
        bg: 'bg-orange-400/10',
    },
]

const ACEITOS = [
    'Produto com defeito de fabricação comprovado',
    'Produto diferente do descrito no site',
    'Produto recebido danificado pelos Correios',
    'Pedido de troca por arrependimento dentro do prazo',
    'Tamanho incorreto (sujeito à disponibilidade em estoque)',
]

const NAO_ACEITOS = [
    'Produto sem etiquetas originais ou lavado',
    'Produto com sinais de uso incompatíveis com a avaliação',
    'Solicitação fora dos prazos estabelecidos',
    'Danos causados por uso inadequado',
    'Produto personalizado ou sob encomenda especial',
]

export default function TrocasEDevolucoesPage() {
    return (
        <main className="min-h-screen bg-black">
            {/* Hero */}
            <div className="border-b border-white/5 py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">
                        Institucional
                    </p>
                    <h1 className="text-[clamp(1.8rem,5vw,4rem)] font-black tracking-tighter uppercase leading-none mb-4">
                        Trocas & Devoluções
                    </h1>
                    <p className="text-neutral-400 text-base max-w-xl mx-auto">
                        Processo simples e transparente. Seu direito de arrependimento e a troca em caso de defeito são sempre garantidos.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

                {/* Prazos */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Prazos</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {PRAZOS.map(({ icon: Icon, titulo, prazo, descricao, cor, bg }) => (
                            <div key={titulo} className="bg-zinc-950 border border-white/8 p-6 hover:border-white/15 transition-all">
                                <div className={`h-10 w-10 ${bg} flex items-center justify-center mb-4`}>
                                    <Icon className={`h-5 w-5 ${cor}`} />
                                </div>
                                <h3 className="font-black uppercase tracking-tight mb-1">{titulo}</h3>
                                <p className={`text-[10px] font-black tracking-widest uppercase ${cor} mb-3`}>{prazo}</p>
                                <p className="text-sm text-neutral-500 leading-relaxed">{descricao}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* O que aceitamos / não aceitamos */}
                <section className="grid sm:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-400" /> Aceitamos
                        </h2>
                        <ul className="space-y-3">
                            {ACEITOS.map((item) => (
                                <li key={item} className="flex gap-3 text-sm text-neutral-400">
                                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-400" /> Não Aceitamos
                        </h2>
                        <ul className="space-y-3">
                            {NAO_ACEITOS.map((item) => (
                                <li key={item} className="flex gap-3 text-sm text-neutral-400">
                                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Passo a passo */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                        Como Solicitar
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                n: '01',
                                titulo: 'Entre em Contato',
                                desc: 'Envie um e-mail para colacomigoshop@gmail.com com o número do pedido, motivo da troca/devolução e fotos do produto (obrigatório para defeitos).',
                            },
                            {
                                n: '02',
                                titulo: 'Aguarde a Aprovação',
                                desc: 'Nossa equipe analisará sua solicitação em até 2 dias úteis e retornará com as instruções para envio.',
                            },
                            {
                                n: '03',
                                titulo: 'Envie o Produto',
                                desc: 'Embale o produto com segurança e envie para o endereço indicado. O custo do frete de retorno é de responsabilidade do cliente, exceto nos casos de defeito de fabricação comprovado.',
                            },
                            {
                                n: '04',
                                titulo: 'Receba sua Solução',
                                desc: 'Após recebermos e analisarmos o produto, realizaremos a troca (sujeita à disponibilidade) ou o reembolso em até 7 dias úteis no mesmo meio de pagamento utilizado.',
                            },
                        ].map(({ n, titulo, desc }) => (
                            <div key={n} className="flex gap-5 border-b border-white/5 pb-4">
                                <span className="text-3xl font-black text-white/10 flex-shrink-0 leading-none">{n}</span>
                                <div>
                                    <h3 className="font-black uppercase tracking-tight text-sm mb-1">{titulo}</h3>
                                    <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA contato */}
                <section className="bg-zinc-950 border border-white/8 p-8 text-center">
                    <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-black uppercase tracking-tight mb-2">Dúvidas?</h2>
                    <p className="text-neutral-400 text-sm mb-6 max-w-sm mx-auto">
                        Nossa equipe está disponível de segunda a sexta, das 9h às 22h, pelo WhatsApp ou e-mail.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="https://wa.me/5563991312913"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-sm"
                        >
                            💬 WhatsApp (63) 99131-2913
                        </a>
                        <a
                            href="mailto:colacomigoshop@gmail.com"
                            className="px-6 py-3 border border-white/15 text-sm font-bold uppercase tracking-widest text-neutral-300 hover:border-white/40 hover:text-white transition-all"
                        >
                            ✉️ colacomigoshop@gmail.com
                        </a>
                    </div>
                </section>
            </div>
        </main>
    )
}
