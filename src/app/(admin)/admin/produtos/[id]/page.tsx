import { ProductFormClient } from '@/components/admin/AdminDynamicComponents'

export const runtime = 'nodejs'

interface Props {
    params: Promise<{ id: string }>
}


export default async function EditProdutoPage({ params }: Props) {
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
