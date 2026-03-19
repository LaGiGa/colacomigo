'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Icons } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
    id: string
    code: string
    description: string | null
    discount_type: 'percent' | 'fixed'
    discount_value: number
    min_order_value: number | null
    max_uses: number | null
    uses_count: number
    is_active: boolean
    expires_at: string | null
    created_at: string
}

import { useEffect } from 'react'

export function CuponsAdminClient({ initialCoupons = [] }: { initialCoupons?: Coupon[] }) {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
    const [loading, setLoading] = useState(initialCoupons.length === 0)

    useEffect(() => {
        if (initialCoupons.length === 0) {
            fetch('/api/admin/coupons')
                .then(res => res.json())
                .then(data => {
                    const couponsList = Array.isArray(data) ? data : (data.coupons || [])
                    setCoupons(couponsList)
                    setLoading(false)
                })
        }
    }, [initialCoupons])

    const [showForm, setShowForm] = useState(false)
    const [editando, setEditando] = useState<Coupon | null>(null)
    const [isPending, startTransition] = useTransition()

    // form
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [discountValue, setDiscountValue] = useState('')
    const [minOrder, setMinOrder] = useState('')
    const [maxUses, setMaxUses] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [ativo, setAtivo] = useState(true)

    if (loading) return <div className="flex items-center justify-center p-20"><Icons.Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

    function resetForm() {
        setCode(''); setDescription(''); setDiscountType('percent')
        setDiscountValue(''); setMinOrder(''); setMaxUses('')
        setExpiresAt(''); setAtivo(true)
    }

    function abrirNovo() { resetForm(); setEditando(null); setShowForm(true) }

    function abrirEditar(c: Coupon) {
        setEditando(c); setCode(c.code); setDescription(c.description ?? '')
        setDiscountType(c.discount_type); setDiscountValue(String(c.discount_value))
        setMinOrder(c.min_order_value ? String(c.min_order_value) : '')
        setMaxUses(c.max_uses ? String(c.max_uses) : '')
        setExpiresAt(c.expires_at ? c.expires_at.slice(0, 10) : '')
        setAtivo(c.is_active); setShowForm(true)
    }

    async function salvar() {
        if (!code.trim() || !discountValue) { toast.error('Código e desconto são obrigatórios.'); return }

        startTransition(async () => {
            const payload = {
                code: code.trim().toUpperCase(),
                description: description.trim() || null,
                discount_type: discountType,
                discount_value: parseFloat(discountValue),
                min_order_value: minOrder ? parseFloat(minOrder) : null,
                max_uses: maxUses ? parseInt(maxUses) : null,
                expires_at: expiresAt || null,
                is_active: ativo,
            }
            const url = editando ? `/api/admin/coupons/${editando.id}` : '/api/admin/coupons'
            const res = await fetch(url, { method: editando ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar.'); return }
            if (editando) {
                setCoupons(prev => prev.map(c => c.id === editando.id ? { ...c, ...payload } : c))
                toast.success('Cupom atualizado!')
            } else {
                setCoupons(prev => [data.coupon, ...prev])
                toast.success('Cupom criado!')
            }
            setShowForm(false); setEditando(null); resetForm()
        })
    }

    async function toggleAtivo(c: Coupon) {
        const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !c.is_active }) })
        if (res.ok) { setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x)); toast.success(`Cupom "${c.code}" ${!c.is_active ? 'ativado' : 'desativado'}.`) }
        else toast.error('Erro ao alterar status.')
    }

    async function excluir(c: Coupon) {
        if (!confirm(`Excluir cupom "${c.code}"?`)) return
        const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' })
        if (res.ok) { setCoupons(prev => prev.filter(x => x.id !== c.id)); toast.success('Cupom excluído.') }
        else toast.error('Erro ao excluir.')
    }

    return (
        <div className="space-y-6">
            {/* Barra */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{coupons.length} cupons · {coupons.filter(c => c.is_active).length} ativos</p>
                <Button className="gradient-brand text-white" size="sm" onClick={abrirNovo}>
                    <Icons.Plus className="h-4 w-4 mr-2" /> Novo Cupom
                </Button>
            </div>

            {/* Formulário */}
            {showForm && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h2 className="font-bold">{editando ? `Editar: ${editando.code}` : 'Novo Cupom'}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Código *</Label>
                            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CUPOM10" className="font-mono uppercase" />
                        </div>
                        <div className="space-y-1">
                            <Label>Tipo de Desconto</Label>
                            <div className="flex gap-2">
                                {(['percent', 'fixed'] as const).map(t => (
                                    <button key={t} onClick={() => setDiscountType(t)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${discountType === t ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                                        {t === 'percent' ? <><Icons.Percent className="h-4 w-4" /> Percentual</> : <><Icons.DollarSign className="h-4 w-4" /> Valor Fixo</>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Valor do Desconto * {discountType === 'percent' ? '(%)' : '(R$)'}</Label>
                            <Input value={discountValue} onChange={e => setDiscountValue(e.target.value)} type="number" min="0" placeholder={discountType === 'percent' ? '10' : '25'} />
                        </div>
                        <div className="space-y-1">
                            <Label>Pedido Mínimo (R$)</Label>
                            <Input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" min="0" placeholder="0 = sem mínimo" />
                        </div>
                        <div className="space-y-1">
                            <Label>Máximo de Usos</Label>
                            <Input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" min="0" placeholder="0 = ilimitado" />
                        </div>
                        <div className="space-y-1">
                            <Label>Validade (data)</Label>
                            <Input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <Label>Descrição (interna)</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Cupom para influencers — Março 2025" />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                                <span className="text-sm">Cupom ativo</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button className="gradient-brand text-white" onClick={salvar} disabled={isPending}>
                            {isPending && <Icons.Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
                        </Button>
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditando(null) }}>Cancelar</Button>
                    </div>
                </div>
            )}

            {/* Lista — cards no mobile, tabela no desktop */}
            <div className="space-y-3 lg:hidden">
                {coupons.length > 0 ? coupons.map(c => (
                    <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <code className="text-base font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{c.code}</code>
                                    {c.is_active
                                        ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Ativo</Badge>
                                        : <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                                </div>
                                {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-lg font-black text-primary">
                                    {c.discount_type === 'percent' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {c.min_order_value && <span>Mín: {formatCurrency(c.min_order_value)}</span>}
                            <span>Usos: {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ''}</span>
                            {c.expires_at && <span>Expira: {new Date(c.expires_at).toLocaleDateString('pt-BR')}</span>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleAtivo(c)}>
                                {c.is_active ? <Icons.XCircle className="h-4 w-4 mr-1 text-muted-foreground" /> : <Icons.CheckCircle className="h-4 w-4 mr-1 text-green-400" />}
                                {c.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => abrirEditar(c)}><Icons.Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => excluir(c)}><Icons.Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )) : (
                    <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                        <Icons.Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum cupom criado.</p>
                    </div>
                )}
            </div>

            {/* Tabela — desktop */}
            <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold">Código</th>
                            <th className="text-left p-4 font-semibold">Desconto</th>
                            <th className="text-left p-4 font-semibold">Mín. Pedido</th>
                            <th className="text-left p-4 font-semibold">Usos</th>
                            <th className="text-left p-4 font-semibold">Validade</th>
                            <th className="text-left p-4 font-semibold">Status</th>
                            <th className="text-left p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.length > 0 ? coupons.map(c => (
                            <tr key={c.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                <td className="p-4">
                                    <code className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">{c.code}</code>
                                    {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                                </td>
                                <td className="p-4 font-bold text-primary">
                                    {c.discount_type === 'percent' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                                </td>
                                <td className="p-4 text-muted-foreground">{c.min_order_value ? formatCurrency(c.min_order_value) : '—'}</td>
                                <td className="p-4 text-muted-foreground">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                                <td className="p-4 text-muted-foreground text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : '—'}</td>
                                <td className="p-4">
                                    <button onClick={() => toggleAtivo(c)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                                        {c.is_active
                                            ? <><Icons.CheckCircle className="h-4 w-4 text-green-400" /><Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Ativo</Badge></>
                                            : <><Icons.XCircle className="h-4 w-4 text-neutral-500" /><Badge variant="secondary" className="text-xs">Inativo</Badge></>}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}><Icons.Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => excluir(c)}><Icons.Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="p-16 text-center text-muted-foreground">
                                <Icons.Ticket className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                <p>Nenhum cupom criado. Clique em &quot;Novo Cupom&quot; para começar.</p>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
