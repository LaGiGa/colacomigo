'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
    images: { url: string; alt?: string }[]
    productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
    const [current, setCurrent] = useState(0)
    const [zoomed, setZoomed] = useState(false)

    if (!images.length) {
        return (
            <div className="aspect-[4/5] bg-zinc-900 rounded-none flex items-center justify-center border border-white/5">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Sem Drop Foto</span>
            </div>
        )
    }

    const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
    const next = () => setCurrent((c) => (c + 1) % images.length)

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-4 items-start">
            {/* Thumbnails Verticais (Estilo Burj) */}
            {images.length > 1 && (
                <div className="flex lg:flex-col gap-3 w-full lg:w-24 overflow-x-auto lg:overflow-y-auto no-scrollbar py-1 shrink-0">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                'relative aspect-[4/5] w-20 lg:w-full shrink-0 border-2 transition-all duration-300',
                                i === current ? 'border-primary opacity-100' : 'border-transparent opacity-40 hover:opacity-80'
                            )}
                        >
                            <Image src={img.url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Imagem Principal */}
            <div className="relative flex-1 w-full bg-[#080808] border border-white/5 overflow-hidden group">
                <div
                    className={cn(
                        "relative aspect-[4/5] w-full transition-transform duration-700 ease-in-out cursor-zoom-in",
                        zoomed && "scale-150 cursor-zoom-out"
                    )}
                    onClick={() => setZoomed(!zoomed)}
                >
                    <Image
                        src={images[current].url}
                        alt={productName}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Controles */}
                {images.length > 1 && !zoomed && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prev() }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); next() }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Zoom Hint */}
                <div className="absolute top-4 right-4 h-10 w-10 bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
                    <ZoomIn className="h-4 w-4 text-white" />
                </div>

                {/* Contador Burj Style */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 transition-all duration-300",
                                i === current ? "w-6 bg-primary" : "w-2 bg-white/20"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
