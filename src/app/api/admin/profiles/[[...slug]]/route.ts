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
            .select('profile_id, city, state')
        
        // 4. Enriquecer os perfis
        const enrichedProfiles = profiles.map(p => {
            const authUser = users?.find(u => u.id === p.id)
            // Tenta encontrar o endereço desse perfil
            const address = addresses?.find(a => a.profile_id === p.id) || null
            
            return {
                ...p,
                email: authUser?.email ?? p.email ?? '—', // Fallback se já existir no profile ou se não achar no auth
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
