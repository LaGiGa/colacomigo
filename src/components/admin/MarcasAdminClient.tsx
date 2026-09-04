'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Boxes, Globe, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from '@/components/ui/icons'
import { optimizeImageFile } from '@/lib/image-client'

interface Marca {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    website: string | null
    is_active: boolean
    sort_order: number
    created_at: string
}

export function MarcasAdminClient({ initialMarcas = [] }: { initialMarcas?: Marca[] }) {
    const [marcas, setMarcas] = useState<Marca[]>(initialMarcas)
    const [loading, setLoading] = useState(initialMarcas.length === 0)

    useEffect(() => {
        if (initialMarcas.length === 0) {
            fetch('/api/admin/brands')
                .then(res => res.json())
                .then(data => {
                    const brandsList = Array.isArray(data) ? data : (data.brands || [])
                    setMarcas(brandsList)
                    setLoading(false)
                })
        }
    }, [initialMarcas])

    const [showForm, setShowForm] = useState(false)
    const [editando, setEditando] = useState<Marca | null>(null)
    const [isPending, startTransition] = useTransition()

    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [website, setWebsite] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [ativa, setAtiva] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

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
        setWebsite('')
        setLogoUrl('')
        setAtiva(true)
        setShowForm(true)
    }

    function abrirEditar(marca: Marca) {
        setEditando(marca)
        setNome(marca.name)
        setDescricao(marca.description ?? '')
        setWebsite(marca.website ?? '')
        setLogoUrl(marca.logo_url ?? '')
        setAtiva(marca.is_active)
        setShowForm(true)
    }

    function cancelar() {
        setShowForm(false)
        setEditando(null)
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingLogo(true)
        try {
            const optimized = await optimizeImageFile(file, { maxSide: 800, quality: 0.85 })
            const formData = new FormData()
            formData.append('file', optimized)
            formData.append('folder', 'marcas')

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data?.url) {
                throw new Error(data?.error || 'Erro no upload do logo')
            }
            setLogoUrl(data.url)
            toast.success('Logo enviado com sucesso!')
        } catch (err: any) {
            console.error('[ERRO UPLOAD LOGO MARCA]', err)
            toast.error(err.message || 'Falha ao enviar logo')
        } finally {
            setUploadingLogo(false)
            if (e.target) e.target.value = ''
        }
    }

    async function salvar() {
        if (!nome.trim()) {
            toast.error('Nome da marca é obrigatório.')
            return
        }

        startTransition(async () => {
            const payload = {
                name: nome.trim(),
                slug: slugify(nome.trim()),
                description: descricao.trim() || null,
                website: website.trim() || null,
                logo_url: logoUrl.trim() || null,
                is_active: ativa,
            }

            const url = editando
                ? `/api/admin/brands/${editando.id}`
                : '/api/admin/brands'
            const method = editando ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao salvar marca.')
                return
            }

            if (editando) {
                setMarcas((prev) => prev.map((m) => (m.id === editando.id ? { ...m, ...payload } : m)))
                toast.success('Marca atualizada!')
            } else {
                setMarcas((prev) => [...prev, data.brand])
                toast.success('Marca criada!')
            }

            setShowForm(false)
            setEditando(null)
        })
    }

    async function toggleAtivo(marca: Marca) {
        const novoStatus = !marca.is_active

        const res = await fetch(`/api/admin/brands/${marca.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: novoStatus }),
        })

        if (res.ok) {
            setMarcas((prev) =>
                prev.map((m) => (m.id === marca.id ? { ...m, is_active: novoStatus } : m))
            )
            toast.success(`Marca "${marca.name}" ${novoStatus ? 'ativada' : 'desativada'}.`)
        } else {
            toast.error('Erro ao alterar status.')
        }
    }

    async function excluir(marca: Marca) {
        if (!confirm(`Excluir a marca "${marca.name}"? Esta ação não pode ser desfeita.`)) return

        const res = await fetch(`/api/admin/brands/${marca.id}`, { method: 'DELETE' })

        if (res.ok) {
            setMarcas((prev) => prev.filter((m) => m.id !== marca.id))
            toast.success(`Marca "${marca.name}" excluída.`)
        } else {
            toast.error('Erro ao excluir marca.')
        }
    }

    return (
        <div className="space-y-6">
            {/* Barra de ações */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    {marcas.length} marca{marcas.length !== 1 ? 's' : ''} · {marcas.filter((m) => m.is_active).length} ativa{marcas.filter((m) => m.is_active).length !== 1 ? 's' : ''}
                </p>
                <Button className="gradient-brand text-white" size="sm" onClick={abrirNova}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Marca
                </Button>
            </div>

            {/* Formulário inline */}
            {showForm && (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <h2 className="font-bold text-base">
                        {editando ? `Editar: ${editando.name}` : 'Nova Marca'}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Nome *</Label>
                            <Input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Supreme"
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

                        {/* Upload de Logo da Marca */}
                        <div className="sm:col-span-2 space-y-2">
                            <Label>Logo da Marca (PNG transparente, SVG ou WebP)</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                            {logoUrl ? (
                                <div className="flex items-center gap-4 p-3 bg-secondary/40 border border-border rounded-xl">
                                    <div className="relative h-14 w-28 bg-black/40 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center p-1">
                                        <Image
                                            src={logoUrl}
                                            alt="Preview do Logo"
                                            fill
                                            className="object-contain"
                                            sizes="120px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">Logo carregado</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{logoUrl}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                        >
                                            Trocar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLogoUrl('')}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-secondary/20 hover:bg-secondary/40"
                                >
                                    {uploadingLogo ? (
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            Enviando e otimizando logo...
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <ImagePlus className="h-8 w-8 text-muted-foreground/60" />
                                            <p className="text-sm font-medium">Clique para selecionar o logo da marca</p>
                                            <p className="text-xs text-muted-foreground">PNG transparente, WebP ou SVG (máx. 800px)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                            <Label>Descrição (opcional)</Label>
                            <Input
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Ex: A marca mais influente do streetwear mundial"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Website (opcional)</Label>
                            <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://www.supremenewyork.com"
                                type="url"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ativa}
                                    onChange={(e) => setAtiva(e.target.checked)}
                                    className="h-4 w-4 accent-blue-500"
                                />
                                <span className="text-sm">Marca ativa (visível na loja)</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button className="gradient-brand text-white" onClick={salvar} disabled={isPending || uploadingLogo}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                        <Button variant="outline" onClick={cancelar}>Cancelar</Button>
                    </div>
                </div>
            )}

            {/* Tabela de marcas (Desktop) / Cards (Mobile) */}
            <div className="grid gap-4">
                {/* Desktop Header - oculto no mobile */}
                <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-6 py-3 bg-secondary/50 border border-border rounded-xl font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <div>Marca</div>
                    <div>Slug</div>
                    <div>Website</div>
                    <div>Status</div>
                    <div className="text-right">Ações</div>
                </div>

                {marcas.length > 0 ? (
                    marcas.map((marca) => (
                        <div key={marca.id} className="bg-card border border-border rounded-2xl p-4 lg:px-6 lg:py-4 transition-all hover:border-primary/20">
                            <div className="flex flex-col lg:grid lg:grid-cols-5 lg:items-center gap-4">
                                {/* Informações principais com miniatura visual */}
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 lg:h-9 lg:w-9 rounded-xl bg-secondary/80 border border-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                        {marca.logo_url ? (
                                            <Image src={marca.logo_url} alt={marca.name} fill className="object-contain p-1" sizes="40px" />
                                        ) : (
                                            <Boxes className="h-5 w-5 lg:h-4 lg:w-4 text-muted-foreground/60" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm lg:text-base truncate">{marca.name}</p>
                                        {marca.description && (
                                            <p className="text-xs text-muted-foreground truncate lg:hidden">
                                                {marca.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Slug - secundário no mobile */}
                                <div className="hidden lg:block">
                                    <code className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                                        {marca.slug}
                                    </code>
                                </div>

                                {/* Website */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground lg:hidden">Site:</span>
                                    {marca.website ? (
                                        <a
                                            href={marca.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                        >
                                            <Globe className="h-3.5 w-3.5" />
                                            <span className="truncate max-w-[150px]">{new URL(marca.website).hostname}</span>
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">—</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between lg:justify-start">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground lg:hidden">Status:</span>
                                    <button
                                        onClick={() => toggleAtivo(marca)}
                                        className="flex items-center gap-2 p-1.5 lg:p-0 rounded-lg lg:bg-transparent transition-colors active:scale-95"
                                    >
                                        {marca.is_active ? (
                                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-bold uppercase py-0.5">Ativa</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5 opacity-50">Inativa</Badge>
                                        )}
                                    </button>
                                </div>

                                {/* Ações - Sempre visível e fácil de tocar */}
                                <div className="flex items-center justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/50">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => abrirEditar(marca)}
                                        className="flex-1 lg:flex-none h-9 lg:h-8 font-bold text-xs"
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 h-9 lg:h-8 aspect-square lg:aspect-auto"
                                        onClick={() => excluir(marca)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-16 text-center text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                        <Boxes className="h-10 w-10 mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg mb-1">Nenhuma marca cadastrada</p>
                        <p className="text-sm">Clique em &quot;Nova Marca&quot; para começar.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
