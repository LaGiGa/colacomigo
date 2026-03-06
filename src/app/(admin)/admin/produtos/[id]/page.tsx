
import { ProductFormClient } from '@/components/admin/AdminDynamicComponents'

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditarProdutoPage({ params }: Props) {
    const { id } = await params
    return (
        <ProductFormClient
            productId={id}
            initialProduct={null}
            categories={[]}
            brands={[]}
        />
    )
}
