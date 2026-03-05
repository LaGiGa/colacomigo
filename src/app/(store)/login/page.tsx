import { Suspense } from 'react'
import { LoginContent } from './LoginContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Entrar | Cola Comigo Shop',
    description: 'Faça login ou crie sua conta para acompanhar seus pedidos.',
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
