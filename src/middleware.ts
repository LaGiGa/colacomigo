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

    // ─── Rota /admin — exige autenticação + is_admin ──────────────────────────
    if (pathname.startsWith('/admin')) {
        // Se for a própria página de login do admin, deixa passar
        if (pathname === '/admin/login') {
            return supabaseResponse
        }

        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Verifica se o usuário tem role 'admin' no profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url))
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
    ],
}
