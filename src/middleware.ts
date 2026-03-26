import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // ─── Rota /admin e /api/admin — exige autenticação + is_admin ──────────────────────────
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

        // Verifica se o usuário tem role 'admin' no profile
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            if (error || !profile || profile.role !== 'admin') {
                console.warn('Acesso negado: Usuário não é admin ou profile não encontrado.')
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
