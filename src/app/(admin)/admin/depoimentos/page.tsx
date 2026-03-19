'use client'
// export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { AlertCircle, Pencil, Plus, Trash2, X } from '@/components/ui/icons'
import { toast } from 'sonner'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Testimonial {
    id: string
    author: string
    city: string
    text: string
    rating: number
    image_url: string | null
    is_active: boolean
    created_at: string
}

export default function TestimonialsAdminPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form states
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        author: '',
        city: '',
        text: '',
        rating: 5,
        image_url: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchTestimonials()
    }, [])

    async function fetchTestimonials() {
        try {
            const res = await fetch('/api/admin/testimonials')
            if (!res.ok) throw new Error('Falha ao carregar')
            const { testimonials } = await res.json()
            setTestimonials(testimonials || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setFormData({ author: '', city: '', text: '', rating: 5, image_url: '' })
        setEditingId(null)
        setIsOpen(false)
    }

    function handleEdit(t: Testimonial) {
        setFormData({
            author: t.author,
            city: t.city,
            text: t.text,
            rating: t.rating,
            image_url: t.image_url || ''
        })
        setEditingId(t.id)
        setIsOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)

        try {
            const url = editingId ? `/api/admin/testimonials/${editingId}` : '/api/admin/testimonials'
            const method = editingId ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar depoimento')
            }

            toast.success(editingId ? 'Depoimento atualizado!' : 'Depoimento criado com sucesso!')
            resetForm()
            fetchTestimonials()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function toggleActive(t: Testimonial) {
        try {
            const res = await fetch(`/api/admin/testimonials/${t.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !t.is_active })
            })
            if (!res.ok) throw new Error('Erro ao alterar status')

            // Atualização Otimista
            setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, is_active: !t.is_active } : item))
            toast.success(t.is_active ? 'Depoimento ocultado' : 'Depoimento visível')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir permanentemente este depoimento?')) return

        try {
            const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao deletar')

            setTestimonials(prev => prev.filter(t => t.id !== id))
            toast.success('Excluído com sucesso')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando depoimentos...</div>

    return (
        <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Depoimentos</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gerencie a prova social que aparece na página inicial
                    </p>
                </div>
                {!isOpen && (
                    <Button onClick={() => setIsOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Novo
                    </Button>
                )}
            </div>

            {/* FORMULÁRIO */}
            {isOpen && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">{editingId ? 'Editar' : 'Novo'} Depoimento</h2>
                        <Button variant="ghost" size="icon" onClick={resetForm}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome do Autor</label>
                                <Input required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="Ex: Lucas Henrique" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cidade/UF</label>
                                <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Ex: Palmas/TO" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Comentário / Depoimento</label>
                            <Textarea required value={formData.text} onChange={(e: any) => setFormData({ ...formData, text: e.target.value })} placeholder="Ex: Produto excelente, a malha é incrível..." rows={3} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Avaliação (1 a 5 estrelas)</label>
                                <Input type="number" min="1" max="5" required value={formData.rating} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground mt-2 block">
                                    Nota: As fotos estão desabilitadas na V1 para priorizar velocidade. Os avatares serão gerados automaticamente baseados na nota (5 estrelas).
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                            <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Salvar Depoimento'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* LISTAGEM */}
            {!isOpen && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {testimonials.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
                            <p>Nenhum depoimento cadastrado.</p>
                            <Button variant="link" onClick={() => setIsOpen(true)}>Clique aqui para adicionar o primeiro</Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {testimonials.map(t => (
                                <div key={t.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-colors ${!t.is_active ? 'opacity-50 bg-secondary/20' : ''}`}>

                                    <div className="h-10 w-10 shrink-0 bg-primary/20 text-primary font-black flex items-center justify-center rounded-full text-lg">
                                        {t.author.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white truncate">{t.author}</h3>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">— {t.city}</span>
                                            <div className="flex text-yellow-500 text-[10px] ml-1">
                                                {'★'.repeat(t.rating)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-neutral-400 line-clamp-2">{t.text}</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-3 sm:mt-0">
                                        <Button
                                            variant={t.is_active ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => toggleActive(t)}
                                            className="h-8 text-xs font-semibold w-24"
                                        >
                                            {t.is_active ? 'Publicado' : 'Oculto'}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-8 w-8 text-neutral-400 hover:text-white">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
