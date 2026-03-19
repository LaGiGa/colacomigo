'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Quote } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface Testimonial {
    id: string
    author: string
    city: string
    text: string
    rating: number
}

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchTestimonials() {
            try {
                const supabase = createClient()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (supabase as any)
                    .from('testimonials')
                    .select('id, author, city, text, rating')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (data) setTestimonials(data)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTestimonials()
    }, [])


    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const container = scrollRef.current
        const scrollAmount = 320

        // Verifica se chegou no fim para resetar
        if (direction === 'right' && container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    // Auto-play
    useEffect(() => {
        if (testimonials.length === 0) return

        const interval = setInterval(() => {
            const container = scrollRef.current
            if (container && !container.matches(':hover')) {
                scroll('right')
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [testimonials.length])

    if (isLoading || testimonials.length === 0) return null

    return (
        <section className="py-16 md:py-24 border-t border-white/5 overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300 mb-4 tracking-widest uppercase">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Comunidade
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4 text-white">
                            O QUE <span className="text-primary italic">DIZEM</span> DE NÓS
                        </h2>
                        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                            A comunidade Cola Comigo cresce a cada drop. Veja o que quem já garantiu seu estilo achou da experiência.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            className="rounded-full border-white/10 bg-black/50 hover:bg-white/10 hover:text-white backdrop-blur-md h-12 w-12 hidden md:flex"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            className="rounded-full border-white/10 bg-black/50 hover:bg-white/10 hover:text-white backdrop-blur-md h-12 w-12 hidden md:flex"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* CARROSSEL GLASSMORPHISM */}
                <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
                    <div
                        ref={scrollRef}
                        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 no-scrollbar items-stretch"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {testimonials.map((t) => (
                            <div
                                key={t.id}
                                className="snap-start shrink-0 w-[280px] md:w-[360px] p-6 lg:p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm shadow-xl flex flex-col justify-between"
                            >
                                <div>
                                    <Quote className="w-8 h-8 text-primary/40 mb-4" />
                                    <div className="flex gap-0.5 mb-4 text-[#ffc107]">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <svg key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-current' : 'fill-white/10'}`} viewBox="0 0 24 24">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 italic">
                                        &quot;{t.text}&quot;
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                                        {t.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{t.author}</p>
                                        <p className="text-[11px] text-neutral-500 font-medium tracking-wide uppercase">{t.city}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fades laterais para mobile */}
                    <div className="absolute top-0 right-0 bottom-8 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none md:hidden" />
                </div>
            </div>

            {/* CSS Global helper para escoder a scrollbar custom */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </section>
    )
}
