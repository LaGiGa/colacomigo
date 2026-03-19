export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = createServiceClient()
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'uploads'
        if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

        const ext = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const filePath = `${folder}/${fileName}`
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
        return NextResponse.json({ url: publicUrl, bucket: uploadedBucket })
    } catch (err: any) {
        console.error('[API ADMIN UPLOAD ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
