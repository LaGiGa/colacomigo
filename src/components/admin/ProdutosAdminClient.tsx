'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Package } from 'lucide-react'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function ProdutosAdminClient({ products: initial = [] }: { products?: any[] }) {
    const [products, setProducts] = useState<any[]>(initial)
    const [loading, setLoading] = useState(initial.length === 0)

    useEffect(() => {
        if (initial.length === 0) {
            fetch('/api/admin/products')
                .then(res => res.json())
                .then(data => {
                    setProducts(data)
                    setLoading(false)
                })
        }
    }, [initial])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Produtos</h1>
                    <p className="text-muted-foreground mt-1">{products?.length ?? 0} produtos cadastrados</p>
                </div>
                <Button className="gradient-brand text-white" asChild>
                    <Link href="/admin/produtos/novo">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Produto
                    </Link>
                </Button>
            </div>

            {/* Tabela (Desktop) */}
            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="text-left p-4 font-semibold">Produto</th>
                            <th className="text-left p-4 font-semibold">Categoria</th>
                            <th className="text-left p-4 font-semibold">Preço</th>
                            <th className="text-left p-4 font-semibold">Variantes</th>
                            <th className="text-left p-4 font-semibold">Status</th>
                            <th className="text-left p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products && products.length > 0 ? (
                            products.map((p: any) => (
                                <tr key={p.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                                {p.images?.[0] ? (
                                                    <img src={p.images[0].url} alt="" className="h-10 w-10 object-cover rounded-lg" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold line-clamp-1">{p.name}</p>
                                                {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                                                {p.brand && <p className="text-xs text-muted-foreground">{p.brand.name}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{p.category?.name ?? '—'}</td>
                                    <td className="p-4">
                                        <p className="font-semibold text-primary">{formatCurrency(p.price)}</p>
                                        {p.compare_price && (
                                            <p className="text-xs text-muted-foreground line-through">{formatCurrency(p.compare_price)}</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-muted-foreground">{p.variants?.length ?? 0}</td>
                                    <td className="p-4">
                                        <Badge variant={p.is_active ? 'default' : 'secondary'}
                                            className={p.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                                            {p.is_active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/produtos/${p.id}`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum produto cadastrado.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cards (Mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {products && products.length > 0 ? (
                    products.map((p: any) => (
                        <div key={p.id} className="rounded-xl border border-border p-4 bg-card space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0].url} alt="" className="h-16 w-16 object-cover" />
                                    ) : (
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-sm text-white line-clamp-2">{p.name}</h3>
                                        <Badge variant={p.is_active ? 'default' : 'secondary'} className={`text-[10px] ${p.is_active ? 'bg-green-500/20 text-green-400' : ''}`}>
                                            {p.is_active ? 'Ativo' : 'Off'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-black text-primary">{formatCurrency(p.price)}</span>
                                        {p.compare_price && <span className="text-[10px] text-muted-foreground line-through">{formatCurrency(p.compare_price)}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{p.category?.name ?? 'S/ Categoria'}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{p.variants?.length ?? 0} variantes</span>
                                </div>
                                <Button size="sm" variant="secondary" className="h-8 px-4 text-xs font-bold" asChild>
                                    <Link href={`/admin/produtos/${p.id}`}>
                                        <Edit className="h-3.5 w-3.5 mr-2" />
                                        Editar
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <p>Nenhum produto cadastrado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
