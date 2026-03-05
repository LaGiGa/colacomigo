import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

// Montserrat — fonte da Burj Clothing
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
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
      <body className={`${montserrat.variable} ${montserrat.className}`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
