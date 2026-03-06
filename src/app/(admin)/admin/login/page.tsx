export const runtime = 'edge';
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error, data } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            // Validar se é admin (Profiles)
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single()

            if (!profile?.is_admin) {
                await supabase.auth.signOut()
                throw new Error('Acesso restrito apenas para administradores.')
            }

            toast.success('Acesso autorizado!')
            router.push('/admin')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao entrar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-primary/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 shadow-xl shadow-primary/20 mb-6 group transition-transform hover:scale-105">
                        <ShieldCheck className="w-8 h-8 text-white transition-transform group-hover:rotate-12" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Painel <span className="text-primary not-italic">Admin</span>
                    </h1>
                    <p className="text-neutral-500 text-sm mt-2 font-medium tracking-wide">
                        SISTEMA DE GESTÃO ESTRATÉGICA
                    </p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Inner light reflex */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">
                                Identificação
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 bg-black/40 border-white/5 h-12 rounded-xl focus:border-primary/50 focus:ring-0 transition-all text-white"
                                    placeholder="admin@colacomigo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">
                                Chave de Acesso
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 bg-black/40 border-white/5 h-12 rounded-xl focus:border-primary/50 focus:ring-0 transition-all text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Entrar no Sistema'
                            )}
                        </Button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Voltar para a Loja
                    </Link>
                </div>
            </div>

            {/* Version indicator */}
            <div className="fixed bottom-6 right-6 text-[10px] font-mono text-neutral-600 uppercase tracking-tighter">
                CC-ADMIN-SYS v2.4.0
            </div>
        </div>
    )
}
