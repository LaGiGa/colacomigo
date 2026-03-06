'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const Loading = ({ text }: { text: string }) => (
    <div className="p-8 text-center text-zinc-500 animate-pulse">{text}</div>
)

export const BannersAdminClient = dynamic(
    () => import('./BannersAdminClient').then(mod => mod.BannersAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando banners..." /> }
)

export const CategoriasAdminClient = dynamic(
    () => import('./CategoriasAdminClient').then(mod => mod.CategoriasAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando categorias..." /> }
)

export const ClientesAdminClient = dynamic(
    () => import('./ClientesAdminClient').then(mod => mod.ClientesAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando clientes..." /> }
)

export const ColecoesAdminClient = dynamic(
    () => import('./ColecoesAdminClient').then(mod => mod.ColecoesAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando coleções..." /> }
)

export const CuponsAdminClient = dynamic(
    () => import('./CuponsAdminClient').then(mod => mod.CuponsAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando cupons..." /> }
)

export const MarcasAdminClient = dynamic(
    () => import('./MarcasAdminClient').then(mod => mod.MarcasAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando marcas..." /> }
)

export const PedidosAdminClient = dynamic(
    () => import('./PedidosAdminClient').then(mod => mod.PedidosAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando pedidos..." /> }
)

export const ProdutosAdminClient = dynamic(
    () => import('./ProdutosAdminClient').then(mod => mod.ProdutosAdminClient),
    { ssr: false, loading: () => <Loading text="Carregando produtos..." /> }
)

export const ProductFormClient = dynamic(
    () => import('./ProductFormClient').then(mod => mod.ProductFormClient),
    { ssr: false, loading: () => <Loading text="Carregando editor..." /> }
)
