import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const DEFAULT_SUPABASE_URL = 'https://ygdlmathcksuhnybkcpy.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGxtYXRoY2tzdWhueWJrY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzUyNzYsImV4cCI6MjA4ODI1MTI3Nn0.-W97wm88UqWT4sLs_Fgfah6NimmcW_lGzkx2OhvsSoc'
const AUTHORIZED_ADMIN_EMAILS = ['colacomigoshop@gmail.com']

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    request.headers.set('x-pathname', pathname)

    // ─── Rota /admin e /api/admin — exige autenticação + whitelist + is_admin ──────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // Se for a própria página de login do admin, deixa passar
        if (pathname === '/admin/login') {
            return supabaseResponse
        }

        if (!user) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        const email = user.email?.toLowerCase().trim()
        if (!email || !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
            console.warn(`[SECURITY] Acesso negado no middleware para e-mail não autorizado: ${email}`)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Acesso Proibido' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Verifica se o usuário tem role 'admin' E is_admin === true no profile
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, is_admin')
                .eq('id', user.id)
                .maybeSingle()

            if (error || !profile || profile.role !== 'admin' || profile.is_admin !== true) {
                console.warn('[SECURITY] Acesso negado: Usuário sem privilégios admin válidos.')
                if (pathname.startsWith('/api/')) {
                    return NextResponse.json({ error: 'Acesso Proibido' }, { status: 403 })
                }
                return NextResponse.redirect(new URL('/admin/login', request.url))
            }
        } catch (error) {
            console.error('Middleware Auth Error:', error)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Erro de Autenticação' }, { status: 500 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // ─── Rota /conta — exige autenticação ────────────────────────────────────
    if (pathname.startsWith('/conta') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/conta/:path*',
        '/api/admin/:path*',
    ],
}
