'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Truck, Save } from 'lucide-react'

const ORDER_STATUSES = [
    { value: 'pending', label: 'Pendente' },
    { value: 'awaiting_payment', label: 'Aguardando Pagamento' },
    { value: 'paid', label: 'Pago' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'refunded', label: 'Reembolsado' },
]

interface OrderStatusUpdaterProps {
    orderId: string
    currentStatus: string
    currentTrackingCode: string
    customerName: string
    customerPhone: string
}

export function OrderStatusUpdater({
    orderId,
    currentStatus,
    currentTrackingCode,
    customerName,
    customerPhone
}: OrderStatusUpdaterProps) {
    const [status, setStatus] = useState(currentStatus)
    const [trackingCode, setTrackingCode] = useState(currentTrackingCode)
    const [isPending, startTransition] = useTransition()

    function handleSave() {
        startTransition(async () => {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, trackingCode }),
            })
            if (res.ok) {
                toast.success('Pedido atualizado com sucesso!')
            } else {
                toast.error('Erro ao atualizar o pedido.')
            }
        })
    }

    function sendWhatsAppTracking() {
        if (!customerPhone) {
            toast.error('Cliente não possui telefone cadastrado.')
            return
        }

        const digits = customerPhone.replace(/\D/g, '')
        const cleanPhone = digits.startsWith('55') ? digits : `55${digits}`
        let msg = ''

        if (trackingCode) {
            msg = `Olá ${customerName || 'campeão'}! 👋\nSeu pedido na *Cola Comigo* já foi enviado! 🚀\n\nCódigo de Rastreio: *${trackingCode.toUpperCase()}*\nVocê pode rastrear pelo site dos Correios.\n\nQualquer dúvida, estamos à disposição!`
        } else {
            msg = `Olá ${customerName || 'campeão'}! 👋\nPassando para confirmar que seu pedido na *Cola Comigo* já está sendo processado! 🚀\n\nEm breve enviaremos o seu código de rastreio por aqui e por e-mail.\n\nQualquer dúvida, estamos à disposição!`
        }

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    function sendEmailTracking() {
        startTransition(async () => {
            const res = await fetch(`/api/admin/orders/${orderId}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingCode }),
            })
            if (res.ok) {
                toast.success('E-mail enviado com sucesso!')
            } else {
                toast.error('Erro ao enviar e-mail.')
            }
        })
    }

    return (
        <div className="rounded-xl border border-border p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Atualizar Pedido
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Status do Pedido</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Código de Rastreio (Correios)</Label>
                    <Input
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="BR000000000BR"
                        className="font-mono uppercase"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="gradient-brand text-white font-semibold"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>

                <Button
                    variant="outline"
                    onClick={sendWhatsAppTracking}
                    className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                >
                    Enviar WhatsApp
                </Button>

                <Button
                    variant="outline"
                    onClick={sendEmailTracking}
                    disabled={isPending}
                    className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                >
                    Enviar Email
                </Button>
            </div>
        </div>
    )
}
