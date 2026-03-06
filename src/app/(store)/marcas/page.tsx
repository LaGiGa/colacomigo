export const runtime = 'edge'
import { MarcasPageClient } from '@/components/store/StoreDynamicComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Marcas | Cola Comigo Shop',
    description: 'Explore todas as marcas na Cola Comigo Shop: Chronic, Supreme, Trip Side, Ripndip, Nike, Adidas e muito mais.',
}

export default function MarcasPage() {
    return <MarcasPageClient />
}
