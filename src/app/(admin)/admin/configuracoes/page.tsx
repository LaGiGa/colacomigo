'use client'
// export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { GripVertical, Loader2, Plus, Save, Settings2, Trash2 } from '@/components/ui/icons'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface StoreSettings {
    id: number
    announcements: string[]
    recent_purchaser_names: string[]
    whatsapp_notify_enabled: boolean
    whatsapp_notify_number: string
}

interface WhatsAppStatus {
    provider: string
    configured: boolean
    enabled: boolean
    number: string | null
}

const PROVIDER_LABELS: Record<string, string> = {
    callmebot: 'CallMeBot (grátis)',
    zapi: 'Z-API',
    meta: 'WhatsApp Cloud API (Meta)',
    none: 'Nenhum provedor configurado',
}

export default function GlobalSettingsAdminPage() {
    const [settings, setSettings] = useState<StoreSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null)
    const [testingWhatsapp, setTestingWhatsapp] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/admin/store-settings')
                if (!res.ok) throw new Error('Falha ao carregar')
                const data = await res.json()
                const base = { announcements: [], recent_purchaser_names: [], whatsapp_notify_enabled: true, whatsapp_notify_number: '' }
                setSettings({ id: 1, ...base, ...(data.settings ?? {}) })

                const statusRes = await fetch('/api/admin/whatsapp-test')
                if (statusRes.ok) setWhatsappStatus(await statusRes.json())
            } catch (err: any) {
                toast.error(err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function save() {
        if (!settings) return
        setSaving(true)
        try {
            const res = await fetch('/api/admin/store-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    announcements: settings.announcements,
                    recent_purchaser_names: settings.recent_purchaser_names,
                    whatsapp_notify_enabled: settings.whatsapp_notify_enabled,
                    whatsapp_notify_number: settings.whatsapp_notify_number,
                }),
            })
            if (!res.ok) throw new Error('Erro ao salvar')
            const data = await res.json()
            setSettings(data.settings)
            toast.success('Configurações Globais Atualizadas!')
        } catch {
            toast.error('Erro ao salvar. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    // Handlers Arrays
    const addAnnouncement = () => {
        setSettings((s) => s ? { ...s, announcements: [...s.announcements, ''] } : null)
    }
    const updateAnnouncement = (index: number, val: string) => {
        setSettings((s) => {
            if (!s) return s
            const copy = [...s.announcements]
            copy[index] = val
            return { ...s, announcements: copy }
        })
    }
    const removeAnnouncement = (index: number) => {
        setSettings((s) => {
            if (!s) return s
            const copy = [...s.announcements]
            copy.splice(index, 1)
            return { ...s, announcements: copy }
        })
    }

    const addName = () => {
        setSettings((s) => s ? { ...s, recent_purchaser_names: [...s.recent_purchaser_names, ''] } : null)
    }
    const updateName = (index: number, val: string) => {
        setSettings((s) => {
            if (!s) return s
            const copy = [...s.recent_purchaser_names]
            copy[index] = val
            return { ...s, recent_purchaser_names: copy }
        })
    }
    const removeName = (index: number) => {
        setSettings((s) => {
            if (!s) return s
            const copy = [...s.recent_purchaser_names]
            copy.splice(index, 1)
            return { ...s, recent_purchaser_names: copy }
        })
    }


    async function testWhatsApp() {
        if (!settings) return
        setTestingWhatsapp(true)
        try {
            // Salva antes de testar, para o disparo usar o número que está na tela
            await save()
            const res = await fetch('/api/admin/whatsapp-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: settings.whatsapp_notify_number }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Falha ao enviar')
            toast.success(`Mensagem de teste enviada via ${data.provider}. Confira o WhatsApp!`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setTestingWhatsapp(false)
        }
    }

    if (loading || !settings) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Settings2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Configurações Gerais</h1>
                        <p className="text-muted-foreground text-sm">
                            Faixa de anúncios, Pop-up de Compras e mais
                        </p>
                    </div>
                </div>
                <Button onClick={save} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    SALVAR TUDO
                </Button>
            </div>

            {/* FAIXA ANUNCIOS */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border/50">
                    <h2 className="font-bold text-sm">Faixa de Anúncios (Topo)</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Frases que ficam rolando no topo do site (ex: Parcelamos no cartão, 5% Off no Pix, etc)
                    </p>
                </div>
                <div className="p-5 space-y-3 bg-secondary/10">
                    {settings.announcements.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma mensagem cadastrada.</p>
                    )}
                    {settings.announcements.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-muted-foreground flex-shrink-0 cursor-grab px-1">
                                <GripVertical className="h-4 w-4" />
                            </span>
                            <Input
                                value={row}
                                onChange={(e) => updateAnnouncement(i, e.target.value)}
                                className="h-9 text-xs"
                                placeholder="🚀 NOVA MENSAGEM AQUI"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => removeAnnouncement(i)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addAnnouncement} className="mt-2 text-xs h-8">
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Frase
                    </Button>
                </div>
            </div>

            {/* NOMES POPUP */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border/50">
                    <h2 className="font-bold text-sm">Nomes Fictícios para o Pop-Up</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Para transmitir prova social, o site exibe pop-ups no canto. Cadastre quais nomes devem ser sorteados.
                    </p>
                </div>
                <div className="p-5 space-y-3 bg-secondary/10">
                    {settings.recent_purchaser_names.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhum nome cadastrado.</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {settings.recent_purchaser_names.map((name, i) => (
                            <div key={i} className="flex items-center gap-1 group">
                                <Input
                                    value={name}
                                    onChange={(e) => updateName(i, e.target.value)}
                                    className="h-8 text-xs"
                                    placeholder="Ex: João Silva"
                                />
                                <button type="button" onClick={() => removeName(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addName} className="mt-4 text-xs h-8">
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Nome
                    </Button>
                </div>
            </div>

            {/* NOTIFICACAO DE VENDA NO WHATSAPP */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-bold text-sm">Aviso de Venda no WhatsApp</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            A cada compra aprovada, a loja recebe uma mensagem com os dados do cliente,
                            os itens e o tipo de entrega (retirada, entrega local ou Correios).
                        </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold flex-shrink-0 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.whatsapp_notify_enabled}
                            onChange={(e) => setSettings((s) => s ? { ...s, whatsapp_notify_enabled: e.target.checked } : s)}
                            className="h-4 w-4 accent-green-500"
                        />
                        {settings.whatsapp_notify_enabled ? 'Ativo' : 'Desativado'}
                    </label>
                </div>
                <div className="p-5 space-y-4 bg-secondary/10">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold">Número que recebe os avisos</label>
                        <Input
                            value={settings.whatsapp_notify_number}
                            onChange={(e) => setSettings((s) => s ? { ...s, whatsapp_notify_number: e.target.value } : s)}
                            className="h-9 text-xs"
                            placeholder="5563991312913 (DDI + DDD + número)"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/40 p-3">
                        <div className="text-xs">
                            <p className="font-semibold">
                                Provedor: {PROVIDER_LABELS[whatsappStatus?.provider ?? 'none'] ?? whatsappStatus?.provider}
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                                {whatsappStatus?.configured
                                    ? 'Credenciais detectadas no servidor.'
                                    : 'Nenhuma credencial configurada — as mensagens não serão enviadas.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testWhatsApp}
                            disabled={testingWhatsapp || saving}
                            className="text-xs h-8 flex-shrink-0"
                        >
                            {testingWhatsapp ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                            Enviar teste
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    )
}
