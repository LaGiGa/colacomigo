export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // Se não encontrou, talvez a tabela exista mas sem a linha 1.
            return NextResponse.json({ settings: null })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ settings: data })
}

export async function PATCH(req: Request) {
    const body = await req.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase
        .from('store_settings')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ settings: data })
}
