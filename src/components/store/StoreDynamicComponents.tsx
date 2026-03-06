'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const Loading = ({ text }: { text: string }) => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse text-neutral-500">{text}</p>
    </div>
)

export const ProdutosPageClient = dynamic(
    () => import('./ProdutosPageClient').then(mod => mod.ProdutosPageClient),
    { ssr: false, loading: () => <Loading text="Carregando coleção..." /> }
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
