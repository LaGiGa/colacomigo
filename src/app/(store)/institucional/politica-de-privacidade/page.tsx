import { Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Privacidade | Cola Comigo Shop',
    description: 'Saiba como a Cola Comigo Shop coleta, usa e protege suas informações pessoais.',
}

const TOPICOS = [
    {
        titulo: '1. Informações que Coletamos',
        conteudo: `Ao utilizar nossa plataforma ou realizar uma compra, podemos coletar as seguintes informações:

• Dados de identificação: nome completo, CPF e data de nascimento
• Dados de contato: e-mail, telefone e endereço de entrega
• Dados de pagamento: somente os dados necessários para processar a transação (não armazenamos dados de cartão)
• Dados de navegação: cookies, endereço IP e informações sobre o dispositivo utilizado
• Histórico de compras e preferências dentro da plataforma`,
    },
    {
        titulo: '2. Como Usamos seus Dados',
        conteudo: `Utilizamos suas informações para:

• Processar e entregar seus pedidos corretamente
• Enviar atualizações sobre o status do seu pedido
• Comunicar promoções, novidades e conteúdo relevante (somente com seu consentimento)
• Melhorar nosso site, produtos e atendimento
• Prevenir fraudes e garantir a segurança da plataforma
• Cumprir obrigações legais e regulatórias`,
    },
    {
        titulo: '3. Compartilhamento de Dados',
        conteudo: `Seus dados podem ser compartilhados apenas nas seguintes situações:

• Com parceiros de pagamento (Mercado Pago) para processamento seguro das transações
• Com transportadoras (Correios) para realização da entrega
• Com autoridades governamentais, quando exigido por lei
• Nunca vendemos ou compartilhamos seus dados com terceiros para fins comerciais`,
    },
    {
        titulo: '4. Cookies',
        conteudo: `Utilizamos cookies para:

• Manter você conectado à sua conta
• Lembrar itens adicionados ao carrinho
• Analisar o desempenho e uso do site (analytics)
• Exibir conteúdo personalizado

Você pode desativar cookies nas configurações do seu navegador, mas algumas funcionalidades do site podem ser afetadas.`,
    },
    {
        titulo: '5. Seus Direitos (LGPD)',
        conteudo: `Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:

• Confirmar se tratamos seus dados pessoais
• Acessar os dados que temos sobre você
• Corrigir dados incompletos, inexatos ou desatualizados
• Solicitar a exclusão dos seus dados (quando aplicável)
• Revogar consentimentos concedidos anteriormente
• Portabilidade dos dados a outro fornecedor de serviço

Para exercer seus direitos, entre em contato: colacomigoshop@gmail.com`,
    },
    {
        titulo: '6. Segurança dos Dados',
        conteudo: `Adotamos medidas técnicas e organizacionais para proteger suas informações:

• Criptografia SSL em todas as páginas do site
• Armazenamento seguro de dados com acesso restrito
• Monitoramento contínuo contra acessos não autorizados
• Parceiros de pagamento certificados PCI-DSS

Embora tomemos todas as precauções, nenhum sistema é 100% inviolável. Em caso de incidente de segurança, notificaremos os usuários afetados.`,
    },
    {
        titulo: '7. Retenção de Dados',
        conteudo: `Mantemos seus dados pelo tempo necessário para:

• Cumprir as finalidades para as quais foram coletados
• Atender requisitos legais e fiscais (mínimo 5 anos para dados de compra)
• Resolver disputas e fazer cumprir nossos contratos

Após esse período, os dados são anonimizados ou excluídos de forma segura.`,
    },
    {
        titulo: '8. Contato',
        conteudo: `Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados:

• E-mail: colacomigoshop@gmail.com
• WhatsApp: (63) 99131-2913 (Seg–Sex, 9h às 22h)
• Endereço: Palmas – TO, Brasil

Esta Política de Privacidade pode ser atualizada periodicamente. Sempre indicaremos a data da última revisão.`,
    },
]

export default function PoliticaPrivacidadePage() {
    return (
        <main className="min-h-screen bg-black">
            {/* Hero */}
            <div className="border-b border-white/5 py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">
                        Institucional
                    </p>
                    <h1 className="text-[clamp(2rem,6vw,4rem)] font-black tracking-tighter uppercase leading-none mb-4">
                        Política de Privacidade
                    </h1>
                    <p className="text-neutral-400 text-base max-w-xl mx-auto">
                        Sua privacidade é nossa prioridade. Saiba como tratamos e protegemos seus dados pessoais.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-xs text-neutral-500">
                            Última atualização: março de 2025 · Em conformidade com a LGPD
                        </span>
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="max-w-3xl mx-auto px-4 py-16">
                <div className="space-y-10">
                    {TOPICOS.map(({ titulo, conteudo }) => (
                        <section key={titulo}>
                            <h2 className="text-base font-black uppercase tracking-tight mb-4 text-white">
                                {titulo}
                            </h2>
                            <div className="text-sm text-neutral-400 leading-[1.9] whitespace-pre-line border-l-2 border-white/5 pl-5">
                                {conteudo}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </main>
    )
}
