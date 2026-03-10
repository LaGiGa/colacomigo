interface OptimizeImageOptions {
    width?: number
    quality?: number
    format?: 'origin' | 'webp'
}

/**
 * Converte URLs públicas do Supabase Storage para endpoint de transformação
 * (render/image), reduzindo drasticamente o payload enviado ao cliente.
 */
export function optimizeImageUrl(
    url?: string | null,
    { width = 1200, quality = 72, format = 'webp' }: OptimizeImageOptions = {}
): string | null {
    if (!url) return null
    if (!url.startsWith('http')) return url

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return url
    }

    // Só transforma URLs do Supabase Storage public object
    if (!parsed.pathname.includes('/storage/v1/object/public/')) {
        return url
    }

    // Alguns tenants do Supabase não têm o recurso render/image habilitado.
    // Só convertemos quando explicitamente habilitado por env.
    if (process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM !== 'true') {
        return url
    }

    parsed.pathname = parsed.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    parsed.searchParams.set('width', String(width))
    parsed.searchParams.set('quality', String(quality))
    if (format !== 'origin') {
        parsed.searchParams.set('format', format)
    }

    return parsed.toString()
}
