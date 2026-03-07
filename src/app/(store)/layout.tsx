import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import {
    AnnouncementBar,
    CartDrawer,
    WhatsAppButton,
    CookieConsent,
    RecentPurchasePopup
} from '@/components/store/StoreDynamicComponents'

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <AnnouncementBar />
            <Header />
            <RecentPurchasePopup />
            {children}
            <Footer />
            {/* Componentes carregados apenas no cliente para economizar bundle edge */}
            <CartDrawer />
            <WhatsAppButton />
            <CookieConsent />
        </div>
    )
}
