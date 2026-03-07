'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Loader2 } from 'lucide-react'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MercadoPago: any
    }
}

interface PaymentBrickProps {
    preferenceId: string
    totalAmount: number
    onSuccess: (paymentId: string) => void
    onPendingPayment?: (payload: { paymentId: string; status: string; pixQrCode?: string | null; pixQrCodeBase64?: string | null }) => void
    onError: (error: Error) => void
}

/**
 * Wrapper para o Checkout Bricks do Mercado Pago (Checkout Transparente).
 * O usuário paga diretamente na nossa página — sem redirecionamento para o MP.
 * Aceita: Cartão de crédito/débito, PIX e boleto bancário.
 */
export function PaymentBrick({ preferenceId, totalAmount, onSuccess, onPendingPayment, onError }: PaymentBrickProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const brickControllerRef = useRef<{ unmount: () => void } | null>(null)
    const [sdkReady, setSdkReady] = useState(false)

    async function initBrick() {
        if (!window.MercadoPago || !containerRef.current) return

        // Destrói instância anterior se existir
        brickControllerRef.current?.unmount()

        const mp = new window.MercadoPago(
            process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
            { locale: 'pt-BR' }
        )

        const bricksBuilder = mp.bricks()

        const settings = {
            initialization: {
                amount: totalAmount,
                preferenceId,
            },
            customization: {
                visual: {
                    style: {
                        theme: 'dark',
                        customVariables: {
                            // Paleta da Cola Comigo Shop
                            baseColor: '#1a8fff',      // azul Cola Comigo
                            baseColorFirstVariant: '#0073e6',
                            baseColorSecondVariant: '#005cc5',
                            secondaryColor: '#1a1a1a', // fundo dark
                            errorColor: '#ef4444',
                            successColor: '#22c55e',
                            warningColor: '#f59e0b',
                            textPrimaryColor: '#fafafa',
                            textSecondaryColor: '#a1a1aa',
                            inputBackgroundColor: '#27272a',
                            inputBorderColor: '#3f3f46',
                            formBackgroundColor: '#18181b',
                            borderRadiusSmall: '8px',
                            borderRadiusMedium: '12px',
                            borderRadiusLarge: '16px',
                            fontSizeExtraSmall: '12px',
                            fontSizeSmall: '14px',
                            fontSizeMedium: '16px',
                            fontSizeLarge: '18px',
                        },
                    },
                    hideFormTitle: true,
                    hidePaymentButton: false,
                },
                paymentMethods: {
                    creditCard: 'all',
                    debitCard: 'all',
                    ticket: 'all', // boleto
                    bankTransfer: 'all', // pix
                    maxInstallments: 12,
                },
            },
            callbacks: {
                onReady: () => {},
                onSubmit: async (
                    { selectedPaymentMethod, formData }: {
                        selectedPaymentMethod: string
                        formData: Record<string, unknown>
                    }
                ) => {
                    const res = await fetch('/api/checkout/process-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ selectedPaymentMethod, formData, preferenceId }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                        if (data.status === 'approved') {
                            onSuccess(data.paymentId)
                        } else if (data.status === 'pending') {
                            onPendingPayment?.({
                                paymentId: data.paymentId,
                                status: data.status,
                                pixQrCode: data.pixQrCode,
                                pixQrCodeBase64: data.pixQrCodeBase64,
                            })
                        } else {
                            onError(new Error(data.error ?? 'Pagamento não aprovado.'))
                        }
                    } else {
                        console.error('[PaymentBrick] Payment error:', data.error);
                        onError(new Error(data.error ?? 'Erro no pagamento'))
                    }
                },
                onError: (error: any) => {
                    console.error('[PaymentBrick] Initialization error:', error);
                    onError(error)
                },
            },
        }

        try {
            brickControllerRef.current = await bricksBuilder.create(
                'payment',
                'payment-brick-container',
                settings
            )
        } catch (error) {
            console.error('[PaymentBrick] Create instance error:', error);
            onError(error instanceof Error ? error : new Error('Falha ao inicializar formulário de pagamento.'));
        }
    }

    useEffect(() => {
        if (sdkReady) initBrick()
        return () => brickControllerRef.current?.unmount()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sdkReady, preferenceId])

    return (
        <>
            <Script
                src="https://sdk.mercadopago.com/js/v2"
                strategy="afterInteractive"
                onLoad={() => {
                    setSdkReady(true);
                }}
                onError={(e) => {
                    console.error('[PaymentBrick] SDK failed to load', e);
                    onError(new Error('Falha ao carregar o SDK do Mercado Pago. Verifique sua conexão ou bloqueadores de anúncios.'));
                }}
            />
            <div
                ref={containerRef}
                id="payment-brick-container"
                className="w-full min-h-[400px] transition-all duration-500"
            />
            {!sdkReady && (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-white/5 bg-zinc-950/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                        Iniciando ambiente seguro de pagamento...
                    </p>
                </div>
            )}
        </>
    )
}

