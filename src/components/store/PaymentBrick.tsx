'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

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
    onError: (error: Error) => void
}

/**
 * Wrapper para o Checkout Bricks do Mercado Pago (Checkout Transparente).
 * O usuário paga diretamente na nossa página — sem redirecionamento para o MP.
 * Aceita: Cartão de crédito/débito, PIX e boleto bancário.
 */
export function PaymentBrick({ preferenceId, totalAmount, onSuccess, onError }: PaymentBrickProps) {
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
                    paymentMethods: {
                        creditCard: 'all',
                        debitCard: 'all',
                        ticket: 'all', // boleto
                        bankTransfer: 'all', // pix
                        maxInstallments: 12,
                    },
                },
                callbacks: {
                    onReady: () => {
                        // Brick carregado
                    },
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
                            onSuccess(data.paymentId)
                        } else {
                            onError(new Error(data.error ?? 'Erro no pagamento'))
                        }
                    },
                    onError: (error: Error) => {
                        console.error('[PaymentBrick] Error', error)
                        onError(error)
                    },
                },
            },
        }

        brickControllerRef.current = await bricksBuilder.create(
            'payment',
            'payment-brick-container',
            settings
        )
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
                onLoad={() => setSdkReady(true)}
            />
            <div ref={containerRef} id="payment-brick-container" className="w-full min-h-[300px]" />
        </>
    )
}
