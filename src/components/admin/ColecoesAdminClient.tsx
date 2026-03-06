'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, Layers, GripVertical } from 'lucide-react'

interface Colecao {
    id: string
    name: string
    slug: string
    description: string | null
    banner_url: string | null
    is_active: boolean
    sort_order: number
    created_at: string
}

import { useEffect } from 'react'

export function ColecoesAdminClient({ colecoes: initial = [] }: { colecoes?: Colecao[] }) {
    const [colecoes, setColecoes] = useState<Colecao[]>(initial)
    const [loading, setLoading] = useState(initial.length === 0)

    useEffect(() => {
        if (initial.length === 0) {
            fetch('/api/admin/collections')
                .then(res => res.json())
                .then(data => {
                    const collectionsList = Array.isArray(data) ? data : (data.collections || [])
                    setColecoes(collectionsList)
                    setLoading(false)
                })
        }
    }, [initial])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    const [showForm, setShowForm] = useState(false)
    const [editando, setEditando] = useState<Colecao | null>(null)
    const [isPending, startTransition] = useTransition()

    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [ativa, setAtiva] = useState(true)

    function slugify(text: string) {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    }

    function abrirNovo() { setEditando(null); setNome(''); setDescricao(''); setAtiva(true); setShowForm(true) }

    function abrirEditar(c: Colecao) {
        setEditando(c); setNome(c.name); setDescricao(c.description ?? ''); setAtiva(c.is_active); setShowForm(true)
    }

    async function salvar() {
        if (!nome.trim()) { toast.error('Nome é obrigatório.'); return }
        startTransition(async () => {
            const payload = { name: nome.trim(), slug: slugify(nome.trim()), description: descricao.trim() || null, is_active: ativa }
            const url = editando ? `/api/admin/collections/${editando.id}` : '/api/admin/collections'
            const res = await fetch(url, { method: editando ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar.'); return }
            if (editando) {
                setColecoes(prev => prev.map(c => c.id === editando.id ? { ...c, ...payload } : c))
                toast.success('Coleção atualizada!')
            } else {
                setColecoes(prev => [...prev, data.collection])
                toast.success('Coleção criada!')
            }
            setShowForm(false); setEditando(null)
        })
    }

    async function toggleAtivo(c: Colecao) {
        const res = await fetch(`/api/admin/collections/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !c.is_active }) })
        if (res.ok) { setColecoes(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x)); toast.success(`Coleção "${c.name}" ${!c.is_active ? 'ativada' : 'desativada'}.`) }
        else toast.error('Erro ao alterar status.')
    }

    async function excluir(c: Colecao) {
        if (!confirm(`Excluir a coleção "${c.name}"?`)) return
        const res = await fetch(`/api/admin/collections/${c.id}`, { method: 'DELETE' })
        if (res.ok) { setColecoes(prev => prev.filter(x => x.id !== c.id)); toast.success('Coleção excluída.') }
        else toast.error('Erro ao excluir.')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{colecoes.length} coleções · {colecoes.filter(c => c.is_active).length} ativas</p>
                <Button className="gradient-brand text-white" size="sm" onClick={abrirNovo}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Coleção
                </Button>
            </div>

            {showForm && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h2 className="font-bold">{editando ? `Editar: ${editando.name}` : 'Nova Coleção'}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Nome *</Label>
                            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Inverno 2025" />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Slug (automático)</Label>
                            <Input value={slugify(nome)} readOnly className="bg-secondary/30 text-muted-foreground text-xs font-mono" />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Descrição</Label>
                            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Peças ideais para o inverno que chegou pesado" />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={ativa} onChange={e => setAtiva(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                                <span className="text-sm">Coleção ativa (visível na loja)</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button className="gradient-brand text-white" onClick={salvar} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
                        </Button>
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditando(null) }}>Cancelar</Button>
                    </div>
                </div>
            )}

            {/* Cards mobile */}
            <div className="space-y-3 lg:hidden">
                {colecoes.length > 0 ? colecoes.map(c => (
                    <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold">{c.name}</p>
                                <code className="text-xs text-muted-foreground">{c.slug}</code>
                                {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                            </div>
                            {c.is_active
                                ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs flex-shrink-0">Ativa</Badge>
                                : <Badge variant="secondary" className="text-xs flex-shrink-0">Inativa</Badge>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleAtivo(c)}>
                                {c.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => abrirEditar(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => excluir(c)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )) : (
                    <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma coleção criada ainda.</p>
                    </div>
                )}
            </div>

            {/* Tabela desktop */}
            <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold w-8"></th>
                            <th className="text-left p-4 font-semibold">Coleção</th>
                            <th className="text-left p-4 font-semibold">Slug</th>
                            <th className="text-left p-4 font-semibold">Descrição</th>
                            <th className="text-left p-4 font-semibold">Status</th>
                            <th className="text-left p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {colecoes.length > 0 ? colecoes.map(c => (
                            <tr key={c.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                <td className="p-4"><GripVertical className="h-4 w-4 text-muted-foreground/30" /></td>
                                <td className="p-4 font-semibold">{c.name}</td>
                                <td className="p-4"><code className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">{c.slug}</code></td>
                                <td className="p-4 text-muted-foreground text-xs max-w-[200px] truncate">{c.description ?? '—'}</td>
                                <td className="p-4">
                                    <button onClick={() => toggleAtivo(c)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                                        {c.is_active
                                            ? <><CheckCircle className="h-4 w-4 text-green-400" /><Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Ativa</Badge></>
                                            : <><XCircle className="h-4 w-4 text-neutral-500" /><Badge variant="secondary" className="text-xs">Inativa</Badge></>}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => excluir(c)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="p-16 text-center text-muted-foreground">
                                <Layers className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                <p>Nenhuma coleção. Clique em &quot;Nova Coleção&quot; para criar.</p>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
