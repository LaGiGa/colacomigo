export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data, error } = await supabase.from('banners').select('*').order('order_index', { ascending: true })
        if (error) throw error
        return NextResponse.json({ banners: data ?? [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        const { data, error } = await supabase.from('banners').insert(body).select().single()
        if (error) throw error
        return NextResponse.json({ banner: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const slug = (await params).slug
        const id = slug?.[0]
        const supabase = createServiceClient()
        const body = await req.json()
        const { data, error } = await supabase.from('banners').update(body).eq('id', id).select().single()
        if (error) throw error
        return NextResponse.json({ banner: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const slug = (await params).slug
        const id = slug?.[0]
        const supabase = createServiceClient()
        const { error } = await supabase.from('banners').delete().eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
