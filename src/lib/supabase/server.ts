import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const DEFAULT_SUPABASE_URL = 'https://ygdlmathcksuhnybkcpy.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGxtYXRoY2tzdWhueWJrY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzUyNzYsImV4cCI6MjA4ODI1MTI3Nn0.-W97wm88UqWT4sLs_Fgfah6NimmcW_lGzkx2OhvsSoc'
function getSupabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
}

function getAnonKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
}

function getServiceRoleKey() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) {
        throw new Error('CONFIG ERROR: SUPABASE_SERVICE_ROLE_KEY não está configurada no ambiente.')
    }
    return key
}

/**
 * Cliente Supabase para Server Components (usa sessão do usuário via cookies).
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        getSupabaseUrl(),
        getAnonKey(),
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { /* ignorado em Server Components */ }
                },
            },
        }
    )
}

/**
 * Cliente Supabase com service_role usando cookies (para middleware e auth checks).
 * Usa createServerClient para manter contexto de sessão.
 */
export async function createAdminClient() {
    const cookieStore = await cookies()

    return createServerClient(
        getSupabaseUrl(),
        getServiceRoleKey(),
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { /* ignorado */ }
                },
            },
        }
    )
}

/**
 * Cliente puro com service_role — SEM cookies, SEM sessão.
 * Use em API Routes e Server Components para operações CRUD admin.
 * Bypassa RLS completamente.
 */
export function createServiceClient() {
    return createSupabaseClient(
        getSupabaseUrl(),
        getServiceRoleKey(),
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
