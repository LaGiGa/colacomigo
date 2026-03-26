/**
 * Converte URLs públicas do Supabase Storage para caminho proxy local.
 * As imagens passam pelo Cloudflare CDN (bandwidth gratuito + cache),
 * evitando egress direto do Supabase Storage.
 *
 * O Next.js Image component cuida do resize e conversão para WebP/AVIF
 * automaticamente via suas props (width, sizes, quality).
 */
export function optimizeImageUrl(
    url?: string | null,
): string | null {
    if (!url) return null
    if (!url.startsWith('http')) return url

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return url
    }

    // Só converte URLs do Supabase Storage public object
    if (!parsed.pathname.includes('/storage/v1/object/public/')) {
        return url
    }

    // Redireciona para proxy local → Cloudflare cacheia → Supabase não gasta egress
    const storagePath = parsed.pathname.replace('/storage/v1/object/public/', '')
    return `/supabase-images/${storagePath}`
}
