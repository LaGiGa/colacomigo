export const runtime = 'edge';
import { BannersAdminClient } from '@/components/admin/AdminDynamicComponents'

export default function BannersPage() {
    // Retornamos uma "casca vazia" servidor-lado. 
    // O bundle do servidor agora não precisa de Supabase, Tirando ~1.5MB de peso.
    return <BannersAdminClient />
}
