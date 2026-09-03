/**
 * Cloudflare R2 Client com Lazy Loading
 * Carrega @aws-sdk/client-s3 dinamicamente sob demanda para otimizar
 * o bundle do Cloudflare Worker (limite de tamanho).
 */

export function isR2Configured(): boolean {
    return Boolean(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    )
}

let s3ClientInstance: any = null

export async function getR2Client() {
    if (s3ClientInstance) return s3ClientInstance

    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Credenciais do Cloudflare R2 não configuradas no ambiente.')
    }

    const { S3Client } = await import('@aws-sdk/client-s3')

    s3ClientInstance = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    })

    return s3ClientInstance
}

export interface UploadToR2Params {
    buffer: Buffer | Uint8Array
    key: string
    contentType?: string
}

export interface UploadToR2Result {
    url: string
    key: string
    bucket: string
}

/**
 * Envia um arquivo binário para o bucket do Cloudflare R2.
 */
export async function uploadToR2({
    buffer,
    key,
    contentType = 'image/webp',
}: UploadToR2Params): Promise<UploadToR2Result> {
    const client = await getR2Client()
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const bucket = process.env.R2_BUCKET_NAME!

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        })
    )

    // Formata o domínio público configurado
    let publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').trim()
    if (!publicDomain) {
        publicDomain = `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    } else if (!publicDomain.startsWith('http')) {
        publicDomain = `https://${publicDomain}`
    }

    // Remove barra final do domínio
    publicDomain = publicDomain.replace(/\/+$/, '')

    // Remove barra inicial da key
    const cleanKey = key.replace(/^\/+/, '')
    const url = `${publicDomain}/${cleanKey}`

    return {
        url,
        key: cleanKey,
        bucket,
    }
}

/**
 * Deleta um objeto do Cloudflare R2 pelo seu caminho/chave.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
    if (!isR2Configured()) return false
    try {
        const client = await getR2Client()
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
        const bucket = process.env.R2_BUCKET_NAME!
        const cleanKey = key.replace(/^\/+/, '')

        await client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: cleanKey,
            })
        )
        return true
    } catch (err) {
        console.error('[R2 DELETE ERROR]', err)
        return false
    }
}
