export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceClient()
        
        // 1. Buscar perfis
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        if (profilesError) throw profilesError

        // 2. Buscar usuários do Auth para pegar os e-mails
        // Usamos listUsers() que requer service_role (já configurado no createServiceClient)
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
        // Se houver erro no auth, não travamos tudo, apenas prosseguimos sem e-mails se necessário
        // Mas como é admin, o ideal é que funcione.
        if (authError) console.error('Auth Admin Error:', authError)

        // 3. Buscar endereços para pegar cidade/estado
        const { data: addresses, error: addressesError } = await supabase
            .from('addresses')
            .select('*')
        
        if (addressesError) console.error('Addresses Error:', addressesError)

        // 4. Enriquecer os perfis
        const enrichedProfiles = profiles.map(p => {
            const authUser = users?.find(u => u.id === p.id)
            const metadata = authUser?.user_metadata || {}
            
            // Tenta pegar o nome de várias fontes (perfil, metadata full_name, metadata name)
            const name = p.full_name || metadata.full_name || metadata.name || metadata.display_name || null

            // Tenta encontrar o endereço (checa user_id ou profile_id conforme o schema)
            const address = addresses?.find(a => (a.user_id === p.id || a.profile_id === p.id)) || null
            
            return {
                ...p,
                full_name: name,
                email: authUser?.email ?? p.email ?? '—',
                city: address?.city ?? '',
                state: address?.state ?? ''
            }
        })

        return NextResponse.json({ profiles: enrichedProfiles })
    } catch (err: any) {
        console.error('[API ADMIN PROFILES GET ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createServiceClient()
        const body = await req.json()
        const { data, error } = await supabase.from('profiles').insert(body).select().single()
        if (error) throw error
        return NextResponse.json({ profile: data })
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
        const { data, error } = await supabase.from('profiles').update(body).eq('id', id).select().single()
        if (error) throw error
        return NextResponse.json({ profile: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
    try {
        const slug = (await params).slug
        const id = slug?.[0]
        const supabase = createServiceClient()
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
