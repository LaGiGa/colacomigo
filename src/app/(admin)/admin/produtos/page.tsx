import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Package } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos | Admin' }

export default async function AdminProdutosPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any

    const { data: products } = await supabase
        .from('products')
        .select(`
      id, name, slug, price, compare_price, is_active, sku, collection,
      brand:brands(name),
      category:categories(name),
      images:product_images(url, is_primary),
      variants:product_variants(id, is_active)
    `)
        .order('created_at', { ascending: false })

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

            {/* Tabela */}
            <div className="rounded-xl border border-border overflow-hidden">
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
                            products.map((p: {
                                id: string; name: string; slug: string; price: number;
                                compare_price?: number; is_active: boolean; sku?: string;
                                brand?: { name: string }; category?: { name: string };
                                images?: { url: string; is_primary: boolean }[];
                                variants?: { id: string; is_active: boolean }[]
                            }) => (
                                <tr key={p.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                                {p.images?.[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
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
                                    <Button className="mt-4 gradient-brand text-white" size="sm" asChild>
                                        <Link href="/admin/produtos/novo">Cadastrar primeiro produto</Link>
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
