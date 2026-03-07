'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Mode = 'login' | 'register'

export function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') ?? '/conta/pedidos'

    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isPending, startTransition] = useTransition()

    const supabase = createClient()

    function handleAuth() {
        startTransition(async () => {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) {
                    toast.error('E-mail ou senha inválidos.')
                    return
                }
                toast.success('Bem-vindo de volta!')
                router.push(redirect)
                router.refresh()
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { display_name: name } },
                })
                if (error) {
                    toast.error(error.message)
                    return
                }
                toast.success('Conta criada! Verifique seu e-mail para confirmar.')
                setMode('login')
            }
        })
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-1">
                    <Link href="/" className="text-2xl font-black tracking-wider">
                        COLA<span className="text-primary">COMIGO</span>
                    </Link>
                    <p className="text-muted-foreground text-sm">
                        {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
                    </p>
                </div>

                <div className="flex rounded-xl overflow-hidden border border-border">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'gradient-brand text-white' : 'hover:bg-secondary'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'gradient-brand text-white' : 'hover:bg-secondary'}`}
                    >
                        Criar Conta
                    </button>
                </div>

                <div className="glass rounded-2xl p-6 space-y-4">
                    {mode === 'register' && (
                        <div className="space-y-1">
                            <Label>Nome completo</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="João Silva"
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label>E-mail</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joao@email.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Senha</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                    </div>

                    <Button
                        onClick={handleAuth}
                        disabled={isPending || !email || !password}
                        className="w-full gradient-brand text-white font-bold h-11"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : mode === 'login' ? (
                            <LogIn className="h-4 w-4 mr-2" />
                        ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                    </Button>

                    {mode === 'login' && (
                        <p className="text-center text-xs text-muted-foreground">
                            Esqueceu a senha?{' '}
                            <Link href="/recuperar-senha" className="text-primary hover:underline">
                                Recuperar
                            </Link>
                        </p>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Dúvidas?{' '}
                    <a href="https://wa.me/5563991312913" className="text-green-400 hover:underline">
                        Fale no WhatsApp
                    </a>
                </p>
            </div>
        </main>
    )
}
