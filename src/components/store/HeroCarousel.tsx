'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Autoplay from 'embla-carousel-autoplay'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'

interface Banner {
    id: string
    title: string
    subtitle: string | null
    image_url: string
    link_url: string
    cta_text: string
}

export function HeroCarousel({ initialBanners }: { initialBanners: Banner[] }) {
    // Se não houver banners no banco, não renderiza nada
    const displayBanners = initialBanners.length > 0 ? initialBanners : []

    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)

    const plugin = React.useRef(
        Autoplay({ delay: 6000, stopOnInteraction: true })
    )

    React.useEffect(() => {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    if (displayBanners.length === 0) return null

    return (
        <section className="relative w-full bg-black group">
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                opts={{ loop: true }}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {displayBanners.map((banner, index) => (
                        <CarouselItem key={banner.id}>
                            <div className="relative h-[85vh] min-h-[600px] w-full cursor-grab active:cursor-grabbing">
                                <Image
                                    src={banner.image_url}
                                    alt={banner.title}
                                    fill
                                    className="object-cover object-center opacity-70"
                                    priority={index === 0}
                                />
                                {/* Overlay Escuro Clássico */}
                                <div className="absolute inset-0 bg-black/40" />

                                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                                    {banner.subtitle && (
                                        <span className="mb-4 inline-block bg-[#1a8fff] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                            ✦ {banner.subtitle}
                                        </span>
                                    )}
                                    <h2 className="mb-8 max-w-5xl text-[clamp(2rem,8vw,7rem)] font-black leading-[0.85] tracking-tighter text-white mix-blend-difference uppercase">
                                        {banner.title}
                                    </h2>
                                    <Button size="lg" className="rounded-none bg-white text-black hover:bg-gray-200 px-10 py-6 h-auto font-black tracking-widest text-sm uppercase transition-transform hover:scale-105" asChild>
                                        <Link href={banner.link_url}>{banner.cta_text}</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navegação por Setas Extremidades (Estilo minimalista) */}
                <CarouselPrevious className="absolute left-6 top-1/2 h-14 w-14 -translate-y-1/2 border-white/20 bg-transparent text-white hover:bg-white hover:text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex" />
                <CarouselNext className="absolute right-6 top-1/2 h-14 w-14 -translate-y-1/2 border-white/20 bg-transparent text-white hover:bg-white hover:text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex" />

                {/* Navegação estilo Burj Clothing (Cápsula + Círculos) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                    {Array.from({ length: count }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            className={`h-2 transition-all duration-300 rounded-full ${current === i
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/40 hover:bg-white/80'
                                }`}
                            aria-label={`Ir para o slide ${i + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </section>
    )
}
