'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_MESSAGES = [
    '🔥 PARCELA NO CARTÃO EM ATÉ 12X SEM JUROS',
    '📦 O CORRE NÃO PARA: ENTREGAMOS EM TODO O BRASIL',
    '🏪 COLA NA LOJA: RETIRE EM PALMAS-TO SEM CUSTO',
    '🛵 ENTREGA RELÂMPAGO EM PALMAS: SÓ R$15,00',
    '💬 DÚVIDAS NO ZAP? (63) 99131-2913',
    '💳 PIX COM 5% OFF: ECONOMIZE NO HYPE',
]

export function AnnouncementBar() {
    const tickerRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<string[]>([])

    // Garante que não há lag na animação CSS
    useEffect(() => {
        if (tickerRef.current) {
            tickerRef.current.style.setProperty('--ticker-duration', '30s')
        }
    }, [])

    useEffect(() => {
        async function load() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const supabase = createClient() as any
            const { data } = await supabase
                .from('store_settings')
                .select('announcements')
                .eq('id', 1)
                .single()

            if (data && data.announcements?.length > 0) {
                setMessages(data.announcements)
            } else {
                setMessages(DEFAULT_MESSAGES)
            }
        }
        load()
    }, [])

    const displayMessages = messages.length > 0 ? messages : DEFAULT_MESSAGES
    const repeated = [...displayMessages, ...displayMessages] // duplica para loop infinito

    if (!displayMessages.length) return null

    return (
        <div className="bg-[#1a8fff] overflow-hidden select-none" style={{ height: '36px' }}>
            <div className="flex items-center h-full overflow-hidden">
                <div
                    ref={tickerRef}
                    className="flex items-center gap-8 whitespace-nowrap"
                    style={{
                        animation: 'ticker 30s linear infinite',
                        display: 'flex',
                        width: 'max-content',
                    }}
                >
                    {repeated.map((msg, i) => (
                        <span key={i} className="flex items-center gap-8 text-black text-[10px] font-black tracking-[0.15em]">
                            {msg}
                            <span className="text-black/40 text-xs">|</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
