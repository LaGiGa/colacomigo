import { GenericStoreContent } from '@/components/store/GenericStoreContent'

export const runtime = 'edge'

export default async function BrandPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    return <GenericStoreContent type="marcas" slug={slug} />
}
