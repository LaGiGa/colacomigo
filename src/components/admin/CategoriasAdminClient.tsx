'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, GripVertical, CheckCircle, XCircle, Tag } from 'lucide-react'

interface Categoria {
    id: string
    name: string
    slug: string
    description: string | null
    is_active: boolean
    sort_order: number
    created_at: string
}

// Categorias padrão da Cola Comigo Shop para seed
const CATEGORIAS_PADRAO = [
    { name: 'Camisas', slug: 'camisas', description: 'Camisas grife e streetwear', position: 1 },
    { name: 'Calças', slug: 'calcas', description: 'Baggy, Cargo, Jogger e mais', position: 2 },
    { name: "Short's", slug: 'shorts', description: 'Bermudas premium', position: 3 },
    { name: 'Tênis', slug: 'tenis', description: 'Sneakers das melhores marcas', position: 4 },
    { name: 'Bonés', slug: 'bones', description: 'Caps e headwear', position: 5 },
    { name: 'Bags', slug: 'bags', description: 'Mochilas, pochetes e bags', position: 6 },
    { name: 'Casacos', slug: 'casacos', description: 'Moletons, jaquetas e mais', position: 7 },
    { name: 'Chinelos', slug: 'chinelos', description: 'Slides e sandálias', position: 8 },
]

interface Props {
    initialCategories?: Categoria[]
}

export function CategoriasAdminClient({ initialCategories = [] }: Props) {
    const [categorias, setCategorias] = useState<Categoria[]>(initialCategories)
    const [loading, setLoading] = useState(initialCategories.length === 0)

    useEffect(() => {
        if (initialCategories.length === 0) {
            fetch('/api/admin/categories')
                .then(res => res.json())
                .then(data => {
                    const categoriesList = Array.isArray(data) ? data : (data.categories || [])
                    setCategorias(categoriesList)
                    setLoading(false)
                })
        }
    }, [initialCategories])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    const [showForm, setShowForm] = useState(false)
    const [editando, setEditando] = useState<Categoria | null>(null)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [ativa, setAtiva] = useState(true)

    function slugify(text: string) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
    }

    function abrirNova() {
        setEditando(null)
        setNome('')
        setDescricao('')
        setAtiva(true)
        setShowForm(true)
    }

    function abrirEditar(cat: Categoria) {
        setEditando(cat)
        setNome(cat.name)
        setDescricao(cat.description ?? '')
        setAtiva(cat.is_active)
        setShowForm(true)
    }

    function cancelar() {
        setShowForm(false)
        setEditando(null)
    }

    async function salvar() {
        if (!nome.trim()) {
            toast.error('Nome da categoria é obrigatório.')
            return
        }

        startTransition(async () => {
            const payload = {
                name: nome.trim(),
                slug: slugify(nome.trim()),
                description: descricao.trim() || null,
                is_active: ativa,
            }

            const url = editando
                ? `/api/admin/categories/${editando.id}`
                : '/api/admin/categories'
            const method = editando ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao salvar categoria.')
                return
            }

            if (editando) {
                setCategorias((prev) => prev.map((c) => (c.id === editando.id ? { ...c, ...payload } : c)))
                toast.success('Categoria atualizada!')
            } else {
                setCategorias((prev) => [...prev, data.category])
                toast.success('Categoria criada!')
            }

            setShowForm(false)
            setEditando(null)
        })
    }

    async function toggleAtivo(cat: Categoria) {
        const novoStatus = !cat.is_active

        const res = await fetch(`/api/admin/categories/${cat.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: novoStatus }),
        })

        if (res.ok) {
            setCategorias((prev) =>
                prev.map((c) => (c.id === cat.id ? { ...c, is_active: novoStatus } : c))
            )
            toast.success(`Categoria "${cat.name}" ${novoStatus ? 'ativada' : 'desativada'}.`)
        } else {
            toast.error('Erro ao alterar status.')
        }
    }

    async function excluir(cat: Categoria) {
        if (!confirm(`Excluir a categoria "${cat.name}"? Esta ação não pode ser desfeita.`)) return

        const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })

        if (res.ok) {
            setCategorias((prev) => prev.filter((c) => c.id !== cat.id))
            toast.success(`Categoria "${cat.name}" excluída.`)
        } else {
            toast.error('Erro ao excluir categoria.')
        }
    }

    async function seedCategorias() {
        if (!confirm('Isso irá criar as 8 categorias padrão da Cola Comigo Shop. Continuar?')) return

        startTransition(async () => {
            let criadas = 0
            for (const cat of CATEGORIAS_PADRAO) {
                const res = await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...cat, is_active: true }),
                })
                if (res.ok) {
                    const data = await res.json()
                    setCategorias((prev) => {
                        // Não duplica se já existir
                        if (prev.find((c) => c.slug === cat.slug)) return prev
                        return [...prev, data.category]
                    })
                    criadas++
                }
            }
            toast.success(`${criadas} categorias criadas com sucesso!`)
        })
    }

    return (
        <div className="space-y-6">
            {/* Barra de ações */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    {categorias.length} categorias · {categorias.filter((c) => c.is_active).length} ativas
                </p>
                <div className="flex gap-2">
                    {categorias.length === 0 && (
                        <Button variant="outline" size="sm" onClick={seedCategorias} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Criar Categorias Padrão
                        </Button>
                    )}
                    <Button className="gradient-brand text-white" size="sm" onClick={abrirNova}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Categoria
                    </Button>
                </div>
            </div>

            {/* Formulário inline */}
            {showForm && (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <h2 className="font-bold text-base">
                        {editando ? `Editar: ${editando.name}` : 'Nova Categoria'}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Nome *</Label>
                            <Input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Camisas"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Slug (gerado automaticamente)</Label>
                            <Input
                                value={slugify(nome)}
                                readOnly
                                className="bg-secondary/30 text-muted-foreground text-xs font-mono"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Descrição (opcional)</Label>
                            <Input
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Ex: Camisas grife e streetwear das melhores marcas"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ativa}
                                    onChange={(e) => setAtiva(e.target.checked)}
                                    className="h-4 w-4 accent-orange-500"
                                />
                                <span className="text-sm">Categoria ativa (visível na loja)</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button className="gradient-brand text-white" onClick={salvar} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                        <Button variant="outline" onClick={cancelar}>Cancelar</Button>
                    </div>
                </div>
            )}

            {/* Grid de Categorias (Desktop: Tabela / Mobile: Cards) */}
            <div className="grid gap-4">
                {/* Header Desktop */}
                <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 py-3 bg-secondary/50 border border-border rounded-xl font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <div className="w-8"></div>
                    <div>Categoria</div>
                    <div>Slug</div>
                    <div>Descrição</div>
                    <div>Status</div>
                    <div className="text-right">Ações</div>
                </div>

                {categorias.length > 0 ? (
                    categorias.map((cat) => (
                        <div key={cat.id} className="bg-card border border-border rounded-2xl p-4 lg:px-6 lg:py-4 transition-all hover:border-primary/20">
                            <div className="flex flex-col lg:grid lg:grid-cols-6 lg:items-center gap-4">
                                {/* Grip/Drag icon - decorativo por enquanto */}
                                <div className="hidden lg:block w-8">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                                </div>

                                {/* Nome */}
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 lg:h-8 lg:w-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 lg:hidden">
                                        <Tag className="h-5 w-5 text-muted-foreground/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm lg:text-base truncate">{cat.name}</p>
                                        <code className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded lg:hidden">
                                            {cat.slug}
                                        </code>
                                    </div>
                                </div>

                                {/* Slug Desktop */}
                                <div className="hidden lg:block">
                                    <code className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                                        {cat.slug}
                                    </code>
                                </div>

                                {/* Descrição */}
                                <div className="text-xs text-muted-foreground lg:truncate">
                                    {cat.description ?? <span className="italic opacity-50">—</span>}
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between lg:justify-start">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground lg:hidden">Status:</span>
                                    <button
                                        onClick={() => toggleAtivo(cat)}
                                        className="flex items-center gap-2 p-1.5 lg:p-0 rounded-lg lg:bg-transparent transition-colors active:scale-95"
                                    >
                                        {cat.is_active ? (
                                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-bold uppercase py-0.5">Ativa</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5 opacity-50">Inativa</Badge>
                                        )}
                                    </button>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/50">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => abrirEditar(cat)}
                                        className="flex-1 lg:flex-none h-9 lg:h-8 font-bold text-xs"
                                    >
                                        <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 h-9 lg:h-8 aspect-square lg:aspect-auto"
                                        onClick={() => excluir(cat)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-16 text-center text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                        <Tag className="h-10 w-10 mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg mb-1">Nenhuma categoria cadastrada</p>
                        <p className="text-sm">Clique em &quot;Nova Categoria&quot; para começar.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
