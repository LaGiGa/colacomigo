'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Componentes que NÃO precisam estar no servidor (não afetam SEO ou são invisíveis inicialmente)
// Isso reduz o bundle das funções Edge do Cloudflare drasticamente.

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

export const WhatsAppButton = dynamic(
    () => import('./WhatsAppButton').then(mod => mod.WhatsAppButton),
    { ssr: false }
)

export const CookieConsent = dynamic(
    () => import('./CookieConsent').then(mod => mod.CookieConsent),
    { ssr: false }
)

export const CartDrawer = dynamic(
    () => import('./CartDrawer').then(mod => mod.CartDrawer),
    { ssr: false }
)
