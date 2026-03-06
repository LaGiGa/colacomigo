
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) ?? 'products'

    if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validações
    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
        return NextResponse.json({ error: `Arquivo muito grande. Máximo ${MAX_MB}MB.` }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Apenas imagens são permitidas.' }, { status: 400 })
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createServiceClient()

        const ext = file.name.split('.').pop() ?? 'jpg'
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error } = await supabase.storage
            .from('cola-comigo')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('cola-comigo')
            .getPublicUrl(filename)

        return NextResponse.json({ url: publicUrl, path: filename })
    } catch (err) {
        console.error('[upload] Erro:', err)
        return NextResponse.json({ error: 'Erro ao fazer upload. Tente novamente.' }, { status: 500 })
    }
}
