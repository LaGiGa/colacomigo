import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = createServiceClient()
    const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ testimonials })
}

export async function POST(req: Request) {
    const supabase = createServiceClient()
    const body = await req.json()

    // Validação básica
    if (!body.author || !body.text || !body.city) {
        return NextResponse.json({ error: 'Autor, cidade e texto são obrigatórios.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('testimonials')
        .insert([{
            author: body.author,
            city: body.city,
            text: body.text,
            rating: body.rating || 5,
            image_url: body.image_url || null,
            is_active: body.is_active ?? true
        }])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ testimonial: data })
}
