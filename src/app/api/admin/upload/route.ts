export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { NextResponse } from 'next/server'
import { isR2Configured, uploadToR2 } from '@/lib/r2'

export async function POST(req: Request) {
    const authError = await requireAdminApi()
    if (authError) return authError

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = (formData.get('folder') as string) || 'uploads'
        if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

        const ext = file.name.split('.').pop() || 'webp'
        const fileName = `${crypto.randomUUID()}.${ext}`
        const filePath = `${folder}/${fileName}`

        // ── 1. Upload prioritário para Cloudflare R2 (Tráfego Ilimitado & Gratuito) ──
        if (isR2Configured()) {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const result = await uploadToR2({
                    buffer,
                    key: filePath,
                    contentType: file.type || 'image/webp',
                })
                return NextResponse.json({ url: result.url, bucket: result.bucket, key: result.key })
            } catch (r2Error: any) {
                console.error('[API ADMIN UPLOAD R2 ERROR]', r2Error)
                return NextResponse.json(
                    { error: `Falha no upload para Cloudflare R2: ${r2Error.message}` },
                    { status: 500 }
                )
            }
        }

        // ── 2. Fallback para Supabase Storage se R2 não estiver configurado ──
        const supabase = createServiceClient()
        const configuredBucket = (process.env.SUPABASE_STORAGE_BUCKET || '').trim()
        const bucketCandidates = Array.from(new Set([
            configuredBucket,
            'public',
            'products',
            'images',
        ].filter(Boolean)))

        let uploadedBucket: string | null = null
        let lastErrorMessage = 'Falha no upload'

        for (const bucket of bucketCandidates) {
            const { error } = await supabase.storage.from(bucket).upload(filePath, file)
            if (!error) {
                uploadedBucket = bucket
                break
            }
            lastErrorMessage = error.message
        }

        if (!uploadedBucket) {
            return NextResponse.json(
                {
                    error: `Falha no upload. Buckets testados: ${bucketCandidates.join(', ')}. Último erro: ${lastErrorMessage}`,
                },
                { status: 500 }
            )
        }

        const { data: { publicUrl } } = supabase.storage.from(uploadedBucket).getPublicUrl(filePath)
        const proxyUrl = `/supabase-images/${uploadedBucket}/${filePath}`
        return NextResponse.json({ url: proxyUrl, directUrl: publicUrl, bucket: uploadedBucket })
    } catch (err: any) {
        console.error('[API ADMIN UPLOAD ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
