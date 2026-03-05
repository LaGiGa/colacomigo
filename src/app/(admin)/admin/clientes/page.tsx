import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clientes | Admin' }

interface Profile {
    id: string
    full_name: string | null
    phone: string | null
    role: string
    created_at: string
    email?: string
    orders_count?: number
    total_spent?: number
}

export default async function AdminClientesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    // Buscar perfis com total gasto
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

    // Buscar emails via auth.users (admin API)
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 100 })

    // Cruzar perfis com emails e contagem de pedidos
    const clientes: Profile[] = (profiles ?? []).map((p: Profile) => {
        const authUser = authData?.users?.find((u: { id: string; email?: string }) => u.id === p.id)
        return { ...p, email: authUser?.email }
    })

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Clientes</h1>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total de Clientes', value: clientes.length, color: 'text-blue-400' },
                    { label: 'Admins', value: clientes.filter(c => c.role === 'admin').length, color: 'text-purple-400' },
                    { label: 'Com Telefone', value: clientes.filter(c => c.phone).length, color: 'text-green-400' },
                    {
                        label: 'Novos (30d)', value: clientes.filter(c => {
                            const d = new Date(c.created_at)
                            return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }).length, color: 'text-orange-400'
                    },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-border p-4 bg-card">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Tabela de clientes */}
            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold">Cliente</th>
                            <th className="text-left p-4 font-semibold">Contato</th>
                            <th className="text-left p-4 font-semibold">Cadastro</th>
                            <th className="text-left p-4 font-semibold">Perfil</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length > 0 ? (
                            clientes.map((c) => (
                                <tr key={c.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                    <td className="p-4">
                                        {/* Avatar inicial */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-black text-primary">
                                                    {(c.full_name ?? c.email ?? '?')[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{c.full_name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{c.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {c.email && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                <span className="text-xs">{c.email}</span>
                                            </div>
                                        )}
                                        {c.phone && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Phone className="h-3 w-3 flex-shrink-0" />
                                                <span className="text-xs">{c.phone}</span>
                                            </div>
                                        )}
                                        {!c.email && !c.phone && <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="p-4 text-muted-foreground text-xs">
                                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4">
                                        <Badge
                                            variant={c.role === 'admin' ? 'default' : 'secondary'}
                                            className={c.role === 'admin' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                                        >
                                            {c.role === 'admin' ? 'Admin' : 'Cliente'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum cliente cadastrado ainda.</p>
                                    <p className="text-xs mt-1">Os clientes aparecem aqui após o primeiro cadastro na loja.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
