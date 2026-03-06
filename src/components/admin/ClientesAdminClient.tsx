'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, MapPin } from 'lucide-react'

interface Props {
    profiles: any[]
}

export function ClientesAdminClient({ profiles }: Props) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground mt-1">{profiles?.length ?? 0} clientes cadastrados</p>
                </div>
            </div>

            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold">Cliente</th>
                            <th className="text-left p-4 font-semibold">Contato</th>
                            <th className="text-left p-4 font-semibold">Localização</th>
                            <th className="text-left p-4 font-semibold">Data Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles && profiles.length > 0 ? (
                            profiles.map((p: any) => (
                                <tr key={p.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{p.full_name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">{p.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span>{p.email}</span>
                                            </div>
                                            {p.phone && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span>{p.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {p.city ? (
                                            <div className="flex items-center gap-2 text-xs">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                <span>{p.city} - {p.state}</span>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {profiles && profiles.length > 0 ? (
                    profiles.map((p: any) => (
                        <div key={p.id} className="rounded-xl border border-border p-4 bg-card space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{p.full_name ?? '—'}</h3>
                                    <p className="text-xs text-muted-foreground">{p.email}</p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-border/40 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{p.city ? `${p.city} - ${p.state}` : 'Endereço não informado'}</span>
                                </div>
                                {p.phone && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{p.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">Nenhum cliente cadastrado.</div>
                )}
            </div>
        </div>
    )
}
