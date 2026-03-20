'use client'

import dynamic from 'next/dynamic'

const Loading = ({ text }: { text: string }) => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <svg 
            className="h-10 w-10 text-primary mb-4 animate-spin" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse text-neutral-500">{text}</p>
    </div>
)

export const ProdutosPageClient = dynamic(
    () => import('./ProdutosPageClient').then(mod => mod.ProdutosPageClient),
    { ssr: false, loading: () => <Loading text="Carregando drop..." /> }
)

export const ProductPageClient = dynamic(
    () => import('./ProductPageClient').then(mod => mod.ProductPageClient),
    { ssr: false, loading: () => <Loading text="Carregando drop..." /> }
)


export const ColecoesPageClient = dynamic(
    () => import('./ColecoesPageClient').then(mod => mod.ColecoesPageClient),
    { ssr: false, loading: () => <Loading text="Carregando coleções..." /> }
)

export const MarcasPageClient = dynamic(
    () => import('./MarcasPageClient').then(mod => mod.MarcasPageClient),
    { ssr: false, loading: () => <Loading text="Carregando marcas..." /> }
)

export const ContaPedidosClient = dynamic(
    () => import('./ContaPedidosClient').then(mod => mod.ContaPedidosClient),
    { ssr: false, loading: () => <Loading text="Carregando seus pedidos..." /> }
)

export const CartDrawer = dynamic(
    () => import('./CartDrawer').then(mod => mod.CartDrawer),
    { ssr: false }
)

export const CheckoutFlow = dynamic(
    () => import('./CheckoutFlow').then(mod => mod.CheckoutFlow),
    { ssr: false, loading: () => <Loading text="Processando checkout..." /> }
)

export const WhatsAppButton = dynamic(
    () => import('./WhatsAppButton').then(mod => mod.WhatsAppButton),
    { ssr: false }
)

export const CookieConsent = dynamic(
    () => import('./CookieConsent').then(mod => mod.CookieConsent),
    { ssr: false }
)

export const HeroCarousel = dynamic(
    () => import('./HeroCarousel').then(mod => mod.HeroCarousel),
    { ssr: false }
)

export const AnnouncementBar = dynamic(
    () => import('./AnnouncementBar').then(mod => mod.AnnouncementBar),
    { ssr: false }
)

export const RecentPurchasePopup = dynamic(
    () => import('./RecentPurchasePopup').then(mod => mod.RecentPurchasePopup),
    { ssr: false }
)

export const TestimonialsSection = dynamic(
    () => import('./TestimonialsSection').then(mod => mod.TestimonialsSection),
    { ssr: false }
)

export const Toaster = dynamic(
    () => import('@/components/ui/sonner').then(mod => mod.Toaster),
    { ssr: false }
)
