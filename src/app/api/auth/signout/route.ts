
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Check if the user is coming from /admin
    const referer = request.headers.get('referer')
    const isAdmin = referer?.includes('/admin')

    await supabase.auth.signOut()

    // Redirect based on where they came from
    const redirectUrl = isAdmin ? '/admin/login' : '/login'

    return NextResponse.redirect(new URL(redirectUrl, request.url), {
        status: 303,
    })
}
