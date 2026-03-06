export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServiceClient()
    const { id } = await params
    const body = await req.json()

    const { data: testimonial, error } = await supabase
        .from('testimonials')
        .update(body)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ testimonial })
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServiceClient()
    const { id } = await params

    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
}
