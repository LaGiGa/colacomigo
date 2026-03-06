export const runtime = 'edge'
import { ColecoesPageClient } from '@/components/store/StoreDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Coleções | Cola Comigo Shop',
    description: 'Explore as coleções exclusivas da Cola Comigo Shop: Streetwear, Nova Coleção e muito mais.',
}

export default function ColecoesPage() {
    return <ColecoesPageClient />
}
