'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, Layout, ImagePlus, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface Banner {
    id: string
    title: string
    subtitle: string | null
    image_url: string
    link_url: string
    cta_text: string
    is_active: boolean
    sort_order: number
    created_at: string
}

interface Props {
    banners: Banner[]
}

export function BannersAdminClient({ banners: initial }: Props) {
    const [banners, setBanners] = useState<Banner[]>(initial)
    const [showForm, setShowForm] = useState(false)
    const [editando, setEditando] = useState<Banner | null>(null)
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    // Form fields
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [linkUrl, setLinkUrl] = useState('')
    const [ctaText, setCtaText] = useState('VER MAIS')
    const [ativa, setAtiva] = useState(true)

    function abrirNovo() {
        setEditando(null)
        setTitle('')
        setSubtitle('')
        setImageUrl('')
        setLinkUrl('')
        setCtaText('VER MAIS')
        setAtiva(true)
        setShowForm(true)
    }

    function abrirEditar(banner: Banner) {
        setEditando(banner)
        setTitle(banner.title)
        setSubtitle(banner.subtitle ?? '')
        setImageUrl(banner.image_url)
        setLinkUrl(banner.link_url)
        setCtaText(banner.cta_text)
        setAtiva(banner.is_active)
        setShowForm(true)
    }

    function cancelar() {
        setShowForm(false)
        setEditando(null)
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (data.url) {
                setImageUrl(data.url)
                toast.success('Imagem carregada!')
            } else {
                toast.error('Erro no upload')
            }
        } catch (err) {
            toast.error('Erro de conexão')
        } finally {
            setUploading(false)
        }
    }

    async function salvar() {
        if (!title.trim() || !imageUrl.trim() || !linkUrl.trim()) {
            toast.error('Título, Imagem e Link são obrigatórios.')
            return
        }

        startTransition(async () => {
            const payload = {
                title: title.trim(),
                subtitle: subtitle.trim() || null,
                image_url: imageUrl.trim(),
                link_url: linkUrl.trim(),
                cta_text: ctaText.trim() || 'VER MAIS',
                is_active: ativa,
            }

            const url = editando
                ? `/api/admin/banners/${editando.id}`
                : '/api/admin/banners'
            const method = editando ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao salvar banner.')
                return
            }

            if (editando) {
                setBanners((prev) => prev.map((b) => (b.id === editando.id ? { ...b, ...payload } : b)))
                toast.success('Banner atualizado!')
            } else {
                setBanners((prev) => [...prev, data.banner])
                toast.success('Banner criado!')
            }

            setShowForm(false)
            setEditando(null)
        })
    }

    async function toggleAtivo(banner: Banner) {
        const novoStatus = !banner.is_active
        const res = await fetch(`/api/admin/banners/${banner.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: novoStatus }),
        })

        if (res.ok) {
            setBanners((prev) =>
                prev.map((b) => (b.id === banner.id ? { ...b, is_active: novoStatus } : b))
            )
            toast.success(`Banner ${novoStatus ? 'ativado' : 'desativado'}.`)
        }
    }

    async function excluir(banner: Banner) {
        if (!confirm(`Excluir este banner?`)) return
        const res = await fetch(`/api/admin/banners/${banner.id}`, { method: 'DELETE' })
        if (res.ok) {
            setBanners((prev) => prev.filter((b) => b.id !== banner.id))
            toast.success(`Banner excluído.`)
        }
    }

    async function mover(banner: Banner, direcao: 'sobe' | 'desce') {
        const index = banners.findIndex(b => b.id === banner.id)
        if (direcao === 'sobe' && index === 0) return
        if (direcao === 'desce' && index === banners.length - 1) return

        const novaLista = [...banners]
        const outroIndex = direcao === 'sobe' ? index - 1 : index + 1
        const temp = novaLista[index]
        novaLista[index] = novaLista[outroIndex]
        novaLista[outroIndex] = temp

        // Otimista
        setBanners(novaLista)

        // Salvar ordens persistentes
        await Promise.all(novaLista.map((b, i) =>
            fetch(`/api/admin/banners/${b.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sort_order: i + 1 })
            })
        ))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    {banners.length} banner{banners.length !== 1 ? 's' : ''} cadastrado(s)
                </p>
                <Button className="gradient-brand text-white" size="sm" onClick={abrirNovo}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Banner
                </Button>
            </div>

            {showForm && (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <h2 className="font-bold text-base">{editando ? 'Editar Banner' : 'Novo Banner'}</h2>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>Título Principal *</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: STREET CULTURE DEFINED" />
                            </div>
                            <div className="space-y-1">
                                <Label>Subtítulo (Opcional)</Label>
                                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ex: COLA COMIGO — PALMAS TO" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Texto do Botão (CTA)</Label>
                                    <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Ex: COMPRAR AGORA" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Link de Destino *</Label>
                                    <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Ex: /produtos ou /categorias/tenis" />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer mt-2">
                                    <input type="checkbox" checked={ativa} onChange={e => setAtiva(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                                    <span className="text-sm font-medium">Banner ativo (visível na loja)</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>Imagem do Banner *</Label>
                            {imageUrl ? (
                                <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-border group">
                                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                                    <button
                                        onClick={() => setImageUrl('')}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                                >
                                    {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
                                    <span className="text-xs font-medium text-muted-foreground">Clique para subir imagem</span>
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                            <p className="text-[10px] text-muted-foreground italic">Recomendado: 1920x800px ou proporção 21:9.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button className="gradient-brand text-white" onClick={salvar} disabled={isPending || uploading}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Salvar Banner
                        </Button>
                        <Button variant="outline" onClick={cancelar}>Cancelar</Button>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {banners.map((banner, i) => (
                    <div key={banner.id} className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 transition-all">
                        <div className="relative w-full md:w-60 aspect-[21/9] rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                            <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />
                            {!banner.is_active && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Badge variant="secondary" className="opacity-100 uppercase text-[10px]">Inativo</Badge>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg leading-tight truncate">{banner.title}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => mover(banner, 'sobe')} disabled={i === 0}>
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => mover(banner, 'desce')} disabled={i === banners.length - 1}>
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(banner)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => excluir(banner)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Badge variant="outline" className="font-bold">{banner.cta_text}</Badge>
                                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                                        <ExternalLink className="h-3 w-3" /> {banner.link_url}
                                    </span>
                                </div>
                                <button onClick={() => toggleAtivo(banner)} className="flex items-center gap-1.5 ml-auto">
                                    {banner.is_active ? (
                                        <><CheckCircle className="h-4 w-4 text-green-400" /><span className="text-green-400 font-medium">Visível</span></>
                                    ) : (
                                        <><XCircle className="h-4 w-4 text-neutral-500" /><span className="text-neutral-500 font-medium">Oculto</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {banners.length === 0 && !showForm && (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
                        <Layout className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <p className="font-bold">Nenhum banner cadastrado</p>
                        <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro banner para destaque na Home.</p>
                        <Button className="mt-6 gradient-brand text-white" onClick={abrirNovo}>Começar agora</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
