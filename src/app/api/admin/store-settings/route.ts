export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single()
        if (error) throw error
        return NextResponse.json({ settings: data })
    } catch (err: any) {
        console.error('[API ADMIN STORE SETTINGS ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** Só estas colunas podem ser alteradas pelo painel. */
const EDITABLE_FIELDS = [
    'announcements',
    'recent_purchaser_names',
    'whatsapp_notify_enabled',
    'whatsapp_notify_number',
] as const

export async function PATCH(req: Request) {
    try {
        const supabase = createServiceClient()
        const body = await req.json()

        const patch: Record<string, unknown> = {}
        for (const field of EDITABLE_FIELDS) {
            if (field in body) patch[field] = body[field]
        }
        if (Object.keys(patch).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
        }

        const { data, error } = await supabase.from('store_settings').update(patch).eq('id', 1).select().single()
        if (error) throw error
        return NextResponse.json({ settings: data })
    } catch (err: any) {
        console.error('[API ADMIN STORE SETTINGS PATCH ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
