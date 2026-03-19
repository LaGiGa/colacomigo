// export const runtime = 'edge';
import { ProductFormClient } from '@/components/admin/AdminDynamicComponents'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'

export default function NovoProdutoPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/produtos" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icons.ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Novo Produto</h1>
                    <p className="text-muted-foreground text-sm">Preencha os dados e faça o upload das fotos</p>
                </div>
            </div>

            <ProductFormClient
                categories={[]}
                brands={[]}
                collections={[]}
            />
        </div>
    )
}
