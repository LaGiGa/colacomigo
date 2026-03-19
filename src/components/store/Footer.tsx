import Link from 'next/link'
import Image from 'next/image'
import { Instagram, MessageCircle } from '@/components/ui/icons'

export function Footer() {
    return (
        <footer className="bg-[#050505] border-t border-[#111] mt-0">
            <div className="container-store py-10 sm:py-14">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">

                    {/* ── Branding ──────────────────── */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="mb-4">
                            <Image
                                src="/logoh.png"
                                alt="Cola Comigo Shop"
                                width={140}
                                height={45}
                                className="h-[38px] w-auto object-contain"
                            />
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed mb-4">
                            O melhor do streetwear autêntico em Palmas-TO.
                            Drops exclusivos, edições limitadas e o corre que você conhece.
                            Cola com a gente.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://www.instagram.com/colacomigo__"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 border border-[#222] flex items-center justify-center text-[#555] hover:text-white hover:border-[#444] transition-colors"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="https://wa.me/5563991312913"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 border border-[#222] flex items-center justify-center text-[#555] hover:text-green-400 hover:border-green-400/40 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* ── Categorias ────────────────── */}
                    <div>
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-white mb-4 uppercase">Categorias</h3>
                        <ul className="space-y-2.5">
                            {[
                                ['Camisas', '/categorias/camisas'],
                                ["Short's", '/categorias/shorts'],
                                ['Calças', '/categorias/calcas'],
                                ['Bonés', '/categorias/bones'],
                                ['Tênis', '/categorias/tenis'],
                                ['Casacos', '/categorias/casacos'],
                                ['Chinelos', '/categorias/chinelos'],
                                ['Bag', '/categorias/bags'],
                            ].map(([label, href]) => (
                                <li key={href}>
                                    <Link href={href} className="text-xs text-[#555] hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Marcas ────────────────────── */}
                    <div>
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-white mb-4 uppercase">Marcas</h3>
                        <ul className="space-y-2.5">
                            {[
                                ['Chronic', '/marcas/chronic'],
                                ['Supreme', '/marcas/supreme'],
                                ['Trip Side', '/marcas/trip-side'],
                                ['Ripndip', '/marcas/ripndip'],
                                ['Nike', '/marcas/nike'],
                                ['Adidas', '/marcas/adidas'],
                            ].map(([label, href]) => (
                                <li key={href}>
                                    <Link href={href} className="text-xs text-[#555] hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Atendimento ───────────────── */}
                    <div>
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-white mb-4 uppercase">Atendimento</h3>
                        <ul className="space-y-2.5 mb-5">
                            {[
                                ['Minha Conta', '/login'],
                                ['Meus Pedidos', '/conta/pedidos'],
                                ['Pagamento e Frete', '/institucional/pagamento-e-frete'],
                                ['Trocas e Devoluções', '/institucional/trocas-e-devolucoes'],
                                ['Política de Privacidade', '/institucional/politica-de-privacidade'],
                            ].map(([label, href]) => (
                                <li key={href}>
                                    <Link href={href} className="text-xs text-[#555] hover:text-white transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Visite nossa loja</p>
                        <p className="text-xs text-[#666] leading-relaxed mb-4">
                            106 Norte, NE 12, Lote 17, Sala 13<br />
                            Palmas - TO, 77006-034
                        </p>
                        <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">WhatsApp</p>
                        <a
                            href="https://wa.me/5563991312913"
                            className="text-sm font-black text-[#25d366] hover:text-[#1fb950] transition-colors"
                        >
                            (63) 99131-2913
                        </a>
                        <p className="text-[9px] text-[#333] mt-1 uppercase tracking-wider">Seg–Sex 9h às 22h</p>
                    </div>
                </div>

                {/* ── Bottom bar ─────────────────── */}
                <div className="mt-10 pt-6 border-t border-[#111] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[10px] text-[#333] text-center sm:text-left">
                        © {new Date().getFullYear()} Cola Comigo Shop · CNPJ 38.738.663/0001-98 · Palmas-TO
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[#333]">
                        <span>Pague com</span>
                        <span className="font-black text-[#555]">Mercado Pago</span>
                        <span>·</span>
                        <span className="font-black text-[#1a8fff]">PIX</span>
                        <span>·</span>
                        <span className="font-black text-[#555]">Correios</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
