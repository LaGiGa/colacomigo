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
            <div className="aspect-[4/5] bg-secondary rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Sem imagem</span>
            </div>
        )
    }

    const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
    const next = () => setCurrent((c) => (c + 1) % images.length)

    return (
        <div className="space-y-3">
            {/* Imagem principal */}
            <div
                className={cn(
                    'relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary group cursor-zoom-in lg:rounded-3xl',
                    zoomed && 'cursor-zoom-out'
                )}
                onClick={() => setZoomed(!zoomed)}
            >
                <Image
                    src={images[current].url}
                    alt={images[current].alt ?? productName}
                    fill
                    className={cn(
                        'object-cover transition-transform duration-500',
                        zoomed ? 'scale-150' : 'group-hover:scale-105'
                    )}
                    priority
                />

                {/* Controles de navegação */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prev() }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); next() }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Hint de zoom */}
                <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4" />
                </div>

                {/* Contador */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 left-2 glass rounded-full px-2 py-0.5 text-xs">
                        {current + 1}/{images.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                'relative flex-shrink-0 aspect-[4/5] w-20 lg:w-24 rounded-lg lg:rounded-xl overflow-hidden border-2 transition-all',
                                i === current ? 'border-primary scale-100 opacity-100' : 'border-transparent hover:border-border opacity-60 hover:opacity-100 scale-95 hover:scale-100'
                            )}
                        >
                            <Image src={img.url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
