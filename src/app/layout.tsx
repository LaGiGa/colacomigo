import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.colacomigoshop.com.br'),
  alternates: {
    canonical: '/',
  },
  title: {
    template: '%s | Cola Comigo Shop',
    default: 'Cola Comigo Shop | Streetwear e Edições Limitadas em Palmas-TO',
  },
  description: 'A maior curadoria de streetwear de Palmas-TO. Bonés, camisas, tênis e acessórios exclusivos. Chronic, Supreme, Trip Side e mais. Atendimento ultra-rápido via WhatsApp!',
  icons: {
    icon: '/cc.png',
    apple: '/cc.png',
    shortcut: '/cc.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Cola Comigo Shop',
    title: 'Cola Comigo Shop | Streetwear de Peso em Palmas-TO',
    description: 'Drops exclusivos e as melhores marcas de streetwear com entrega relâmpago em Palmas.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
