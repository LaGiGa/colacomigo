/**
 * Otimiza e converte arquivos de imagem no navegador para WebP de alta fidelidade
 * antes do upload para o Cloudflare R2 / Storage.
 */
export async function optimizeImageFile(
    file: File,
    options: { maxSide?: number; quality?: number } = {}
): Promise<File> {
    const { maxSide = 1600, quality = 0.85 } = options

    if (!file.type.startsWith('image/')) return file
    if (file.type === 'image/svg+xml') return file

    try {
        const bitmap = await createImageBitmap(file)
        const largestDimension = Math.max(bitmap.width, bitmap.height)
        const ratio = largestDimension > maxSide ? maxSide / largestDimension : 1

        const targetWidth = Math.max(1, Math.round(bitmap.width * ratio))
        const targetHeight = Math.max(1, Math.round(bitmap.height * ratio))

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            bitmap.close()
            return file
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
        bitmap.close()

        const webpBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/webp', quality)
        )

        if (!webpBlob) return file

        const cleanBaseName = file.name.replace(/\.[^.]+$/, '')
        const optimizedName = `${cleanBaseName}.webp`

        return new File([webpBlob], optimizedName, {
            type: 'image/webp',
            lastModified: Date.now(),
        })
    } catch (err) {
        console.warn('[IMAGE OPTIMIZE] Falha ao converter imagem no cliente, enviando original:', err)
        return file
    }
}
