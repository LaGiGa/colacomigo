import { CartDrawer } from '@/components/store/CartDrawer'
import { WhatsAppButton } from '@/components/store/WhatsAppButton'
import { CookieConsent } from '@/components/store/CookieConsent'

// AnnouncementBar e RecentPurchasePopup são incluídos individualmente 
// em cada page para controle fino de exibição
export default function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
            {/* CartDrawer global — disponível em todas as páginas da vitrine */}
            <CartDrawer />
            {/* Botão Flutuante do WhatsApp Global */}
            <WhatsAppButton />
            {/* Aviso de Cookies */}
            <CookieConsent />
        </>
    )
}
