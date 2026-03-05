'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Truck, Store, Package, Zap,
    AlertCircle, CheckCircle2, Loader2, Save, Settings2
} from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

interface ShippingSettings {
    id: number
    free_shipping_enabled: boolean
    free_shipping_threshold: number
    store_pickup_enabled: boolean
    store_pickup_label: string
    local_delivery_enabled: boolean
    local_delivery_label: string
    local_delivery_price: number
    local_delivery_days: number
    correios_enabled: boolean
    correios_cep_origin: string
    updated_at: string
}

// ─── Toggle switch component ───────────────────────────────────────────
function Toggle2({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean
    onChange: (v: boolean) => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-primary' : 'bg-zinc-700'
                }`}
            aria-pressed={checked}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    )
}

// ─── Seção de configuração ─────────────────────────────────────────────
function ConfigSection({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    enabled,
    onToggle,
    children,
    saving,
}: {
    icon: React.ElementType
    iconColor: string
    title: string
    subtitle: string
    enabled: boolean
    onToggle: (v: boolean) => void
    children?: React.ReactNode
    saving?: boolean
}) {
    return (
        <div className={`rounded-xl border transition-all duration-300 ${enabled ? 'border-border bg-card' : 'border-border/40 bg-card/40 opacity-70'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconColor} bg-current/10`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <span className={`text-xs font-semibold ${enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {enabled ? 'Ativo' : 'Desabilitado'}
                    </span>
                    <Toggle2 checked={enabled} onChange={onToggle} />
                </div>
            </div>

            {/* Body — campos extras */}
            {enabled && children && (
                <>
                    <Separator className="bg-border/40" />
                    <div className="p-5 space-y-4">{children}</div>
                </>
            )}
        </div>
    )
}

// ─── Campo de input estilizado ─────────────────────────────────────────
function Field({
    label,
    hint,
    prefix,
    suffix,
    value,
    onChange,
    type = 'text',
    min,
}: {
    label: string
    hint?: string
    prefix?: string
    suffix?: string
    value: string | number
    onChange: (v: string) => void
    type?: 'text' | 'number'
    min?: number
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
            </label>
            <div className="flex items-center rounded-lg border border-input bg-background overflow-hidden">
                {prefix && (
                    <span className="px-3 py-2.5 text-sm font-bold text-muted-foreground bg-muted border-r border-input">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    min={min}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-foreground"
                />
                {suffix && (
                    <span className="px-3 py-2.5 text-sm font-medium text-muted-foreground bg-muted border-l border-input">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    )
}

// ─── Página principal ──────────────────────────────────────────────────
export default function FreteAdminPage() {
    const [settings, setSettings] = useState<ShippingSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [savingField, setSavingField] = useState<string | null>(null)

    const load = useCallback(async () => {
        const res = await fetch('/api/admin/shipping-settings')
        const data = await res.json()
        if (data.settings) setSettings(data.settings)
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    async function save(patch: Partial<ShippingSettings>, field: string) {
        setSavingField(field)
        try {
            const res = await fetch('/api/admin/shipping-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSettings(data.settings)
            toast.success('Configuração salva!')
        } catch {
            toast.error('Erro ao salvar. Tente novamente.')
        } finally {
            setSavingField(null)
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
        <div className="max-w-2xl space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Settings2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Configurações de Frete</h1>
                    <p className="text-muted-foreground text-sm">
                        Ative, desative e personalize as opções de entrega da loja
                    </p>
                </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300 leading-relaxed">
                    As alterações são aplicadas <strong>imediatamente</strong> no checkout da loja.
                    Não é necessário reiniciar o servidor.
                </p>
            </div>

            {/* ── 1. FRETE GRÁTIS ─────────────────────────────── */}
            <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" /> Regras Automáticas
                </h2>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-green-500/10">
                                <Zap className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Frete Grátis Automático</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {settings.free_shipping_enabled
                                        ? `Ativado para compras acima de ${formatCurrency(settings.free_shipping_threshold)}`
                                        : 'Desabilitado — frete sempre cobrado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {savingField === 'free_shipping' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <span className={`text-xs font-semibold ${settings.free_shipping_enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {settings.free_shipping_enabled ? 'Ativo' : 'Desabilitado'}
                            </span>
                            <Toggle2
                                checked={settings.free_shipping_enabled}
                                onChange={(v) => save({ free_shipping_enabled: v }, 'free_shipping')}
                            />
                        </div>
                    </div>

                    {settings.free_shipping_enabled && (
                        <>
                            <Separator className="bg-border/40" />
                            <div className="p-5 space-y-4">
                                <Field
                                    label="Valor mínimo para frete grátis"
                                    hint="Compras acima deste valor ganham frete grátis (PAC Correios)"
                                    prefix="R$"
                                    type="number"
                                    min={0}
                                    value={settings.free_shipping_threshold}
                                    onChange={(v) => setSettings(s => s ? { ...s, free_shipping_threshold: parseFloat(v) || 0 } : s)}
                                />
                                <button
                                    onClick={() => save({ free_shipping_threshold: settings.free_shipping_threshold }, 'free_shipping')}
                                    disabled={savingField === 'free_shipping'}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Salvar valor mínimo
                                </button>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <p className="text-xs text-green-400">
                                        Clientes com carrinho ≥ {formatCurrency(settings.free_shipping_threshold)} verão banner de frete grátis no checkout
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── 2. OPÇÕES DE ENTREGA ────────────────────────── */}
            <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" /> Opções de Entrega
                </h2>

                {/* Retirada na loja */}
                <ConfigSection
                    icon={Store}
                    iconColor="text-blue-400"
                    title={settings.store_pickup_label}
                    subtitle="Grátis — cliente retira no endereço da loja"
                    enabled={settings.store_pickup_enabled}
                    saving={savingField === 'store_pickup'}
                    onToggle={(v) => save({ store_pickup_enabled: v }, 'store_pickup')}
                >
                    <Field
                        label="Nome exibido no checkout"
                        hint="Ex: Retirar na Loja, Buscar no Balcão..."
                        value={settings.store_pickup_label}
                        onChange={(v) => setSettings(s => s ? { ...s, store_pickup_label: v } : s)}
                    />
                    <button
                        onClick={() => save({ store_pickup_label: settings.store_pickup_label }, 'store_pickup')}
                        disabled={savingField === 'store_pickup'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-3.5 w-3.5" /> Salvar nome
                    </button>
                </ConfigSection>

                {/* Entrega local */}
                <ConfigSection
                    icon={Package}
                    iconColor="text-orange-400"
                    title={settings.local_delivery_label}
                    subtitle={`R$ ${settings.local_delivery_price.toFixed(2)} — ${settings.local_delivery_days} dia(s) útil(is)`}
                    enabled={settings.local_delivery_enabled}
                    saving={savingField === 'local_delivery'}
                    onToggle={(v) => save({ local_delivery_enabled: v }, 'local_delivery')}
                >
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                            label="Nome exibido"
                            value={settings.local_delivery_label}
                            onChange={(v) => setSettings(s => s ? { ...s, local_delivery_label: v } : s)}
                        />
                        <Field
                            label="Prazo estimado"
                            suffix="dia(s)"
                            type="number"
                            min={0}
                            value={settings.local_delivery_days}
                            onChange={(v) => setSettings(s => s ? { ...s, local_delivery_days: parseInt(v) || 1 } : s)}
                        />
                        <Field
                            label="Preço da entrega"
                            prefix="R$"
                            type="number"
                            min={0}
                            hint="0 = grátis para entrega local"
                            value={settings.local_delivery_price}
                            onChange={(v) => setSettings(s => s ? { ...s, local_delivery_price: parseFloat(v) || 0 } : s)}
                        />
                    </div>
                    <button
                        onClick={() => save({
                            local_delivery_label: settings.local_delivery_label,
                            local_delivery_price: settings.local_delivery_price,
                            local_delivery_days: settings.local_delivery_days,
                        }, 'local_delivery')}
                        disabled={savingField === 'local_delivery'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-3.5 w-3.5" /> Salvar configurações
                    </button>
                </ConfigSection>

                {/* Correios */}
                <ConfigSection
                    icon={Truck}
                    iconColor="text-yellow-400"
                    title="Correios (PAC / SEDEX)"
                    subtitle="Calculado via API oficial dos Correios com base no CEP"
                    enabled={settings.correios_enabled}
                    saving={savingField === 'correios'}
                    onToggle={(v) => save({ correios_enabled: v }, 'correios')}
                >
                    <Field
                        label="CEP de origem (sua loja)"
                        hint="CEP de onde os pacotes são enviados — afeta o cálculo do frete"
                        value={settings.correios_cep_origin}
                        onChange={(v) => setSettings(s => s ? { ...s, correios_cep_origin: v.replace(/\D/g, '').slice(0, 8) } : s)}
                    />
                    <button
                        onClick={() => save({ correios_cep_origin: settings.correios_cep_origin }, 'correios')}
                        disabled={savingField === 'correios'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-3.5 w-3.5" /> Salvar CEP de origem
                    </button>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-400 leading-relaxed">
                            Para usar a API dos Correios, configure as variáveis
                            <code className="mx-1 font-mono bg-yellow-500/10 px-1 rounded">CORREIOS_USER</code>,
                            <code className="mx-1 font-mono bg-yellow-500/10 px-1 rounded">CORREIOS_PASSWORD</code> e
                            <code className="mx-1 font-mono bg-yellow-500/10 px-1 rounded">CORREIOS_NUMERO_CARTAO_POSTAGEM</code> no painel de variáveis de ambiente.
                        </p>
                    </div>
                </ConfigSection>
            </div>

            {/* Última atualização */}
            <p className="text-[11px] text-muted-foreground text-right">
                Última atualização: {new Date(settings.updated_at).toLocaleString('pt-BR')}
            </p>
        </div>
    )
}
