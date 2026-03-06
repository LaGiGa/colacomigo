import { CartDrawer, WhatsAppButton, CookieConsent } from '@/components/store/StoreDynamicComponents'

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
            {/* Componentes carregados apenas no cliente para economizar bundle edge */}
            <CartDrawer />
            <WhatsAppButton />
            <CookieConsent />
        </>
    )
}
