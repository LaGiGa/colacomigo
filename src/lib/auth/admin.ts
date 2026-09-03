import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export const AUTHORIZED_ADMIN_EMAILS = [
    'colacomigoshop@gmail.com',
]

export interface AdminAuthResult {
    authorized: boolean
    user: any | null
    profile?: any | null
    reason?: 'not_authenticated' | 'unauthorized_email' | 'forbidden'
}

/**
 * Valida de forma estrita e centralizada a sessão do administrador no servidor:
 * 1. Valida se há usuário autenticado via cookies criptografados.
 * 2. Valida se o e-mail está na whitelist estrita de administradores autorizados.
 * 3. Valida no banco de dados se role === 'admin' E is_admin === true.
 */
export async function verifyAdminSession(): Promise<AdminAuthResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { authorized: false, user: null, reason: 'not_authenticated' }
        }

        const email = user.email?.toLowerCase().trim()
        if (!email || !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
            console.warn(`[SECURITY ALERT] Tentativa de acesso admin por email não autorizado: ${email} (ID: ${user.id})`)
            return { authorized: false, user, reason: 'unauthorized_email' }
        }

        // Consulta banco via serviceClient para checagem com fonte de verdade incontestável
        const serviceClient = createServiceClient()
        const { data: profile, error: profileError } = await serviceClient
            .from('profiles')
            .select('id, role, is_admin')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            console.warn(`[SECURITY ALERT] Perfil admin não encontrado no banco para usuário ${user.id}`)
            return { authorized: false, user, reason: 'forbidden' }
        }

        if (profile.role !== 'admin' || profile.is_admin !== true) {
            console.warn(`[SECURITY ALERT] Usuário ${user.id} sem privilégios admin completos (role: ${profile.role}, is_admin: ${profile.is_admin})`)
            return { authorized: false, user, reason: 'forbidden' }
        }

        return { authorized: true, user, profile }
    } catch (err) {
        console.error('[SECURITY ERROR] Falha inesperada em verifyAdminSession:', err)
        return { authorized: false, user: null, reason: 'forbidden' }
    }
}

/**
 * Guardião para Server Components e Layouts.
 * Se não for admin autorizado, redireciona imediatamente para o login.
 */
export async function requireAdminPage() {
    const auth = await verifyAdminSession()
    if (!auth.authorized) {
        redirect('/admin/login')
    }
    return auth
}

/**
 * Guardião para Route Handlers (/api/admin/*).
 * Retorna NextResponse de erro caso não autorizado, ou null se autorizado.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
    const auth = await verifyAdminSession()
    if (!auth.authorized) {
        const status = auth.reason === 'not_authenticated' ? 401 : 403
        const message = auth.reason === 'not_authenticated' ? 'Não autorizado: Faça login' : 'Acesso Proibido: Administrador não reconhecido'
        return NextResponse.json({ error: message }, { status })
    }
    return null
}
