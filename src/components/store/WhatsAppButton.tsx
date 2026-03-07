'use client'

export function WhatsAppButton() {
    const phoneNumber = '5563991312913'
    const message = encodeURIComponent('Salve! Vi o site da Cola Comigo e quero garantir meu drop com 10% no PIX. Me ajuda?')
    const href = `https://wa.me/${phoneNumber}?text=${message}`

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Mobile: compacto */}
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-[#25D366] text-black shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-all hover:scale-105 hover:shadow-[0_12px_30px_rgba(37,211,102,0.55)] active:scale-95"
                aria-label="Falar no WhatsApp"
            >
                <span className="absolute -top-2 -right-2 rounded-full bg-[#1a8fff] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    10% PIX
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                >
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.556 4.195 1.613 6.01L.001 24l6.126-1.607a11.966 11.966 0 0 0 5.904 1.554h.005c6.645 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zm0 21.964h-.004a9.982 9.982 0 0 1-5.093-1.39l-.365-.216-3.784.992.997-3.69-.238-.378a9.97 9.97 0 0 1-1.527-5.253C1.986 6.471 6.472 1.985 12.031 1.985c2.658 0 5.158 1.036 7.037 2.915a9.946 9.946 0 0 1 2.915 7.035c0 5.46-4.486 9.945-10.046 9.945h.004..." />
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.556 4.195 1.613 6.01L.001 24l6.126-1.607a11.966 11.966 0 0 0 5.904 1.554h.005c6.645 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zm0 21.964h-.004a9.982 9.982 0 0 1-5.093-1.39l-.365-.216-3.784.992.997-3.69-.238-.378a9.97 9.97 0 0 1-1.527-5.253C1.986 6.471 6.472 1.985 12.031 1.985c2.658 0 5.158 1.036 7.037 2.915a9.946 9.946 0 0 1 2.915 7.035c0 5.46-4.486 9.945-10.046 9.945zm5.497-6.834c-.302-.151-1.789-.882-2.066-.983-.277-.101-.48-.151-.682.151-.202.302-.782.983-.959 1.184-.176.201-.354.227-.656.076-.302-.151-1.277-.47-2.433-1.503-.9-.804-1.508-1.796-1.684-2.098-.176-.302-.019-.465.132-.616.136-.135.302-.353.454-.529.151-.176.202-.302.302-.503.101-.202.051-.378-.025-.529-.076-.151-.682-1.643-.933-2.247-.245-.591-.497-.509-.682-.518-.176-.008-.378-.01-.58-.01-.202 0-.529.076-.807.378-.277.302-1.059 1.033-1.059 2.518s1.084 2.915 1.236 3.116c.151.202 2.125 3.242 5.144 4.544 2.458 1.063 3.149 1.127 4.226.94 1.144-.197 3.011-1.232 3.435-2.422.422-1.19.422-2.21.296-2.422-.125-.211-.478-.337-.78-.488z" />
                </svg>
            </a>

            {/* Desktop/Tablet: CTA completo */}
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex group relative h-14 items-center gap-2 rounded-full border-2 border-white/80 bg-[#25D366] px-4 text-black shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-all hover:scale-105 hover:shadow-[0_12px_30px_rgba(37,211,102,0.55)] active:scale-95"
                aria-label="Falar no WhatsApp"
            >
                <span className="absolute -top-2 -right-2 rounded-full bg-[#1a8fff] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    10% PIX
                </span>
                <span className="h-2 w-2 rounded-full bg-black/70 animate-pulse" />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                >
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.556 4.195 1.613 6.01L.001 24l6.126-1.607a11.966 11.966 0 0 0 5.904 1.554h.005c6.645 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zm0 21.964h-.004a9.982 9.982 0 0 1-5.093-1.39l-.365-.216-3.784.992.997-3.69-.238-.378a9.97 9.97 0 0 1-1.527-5.253C1.986 6.471 6.472 1.985 12.031 1.985c2.658 0 5.158 1.036 7.037 2.915a9.946 9.946 0 0 1 2.915 7.035c0 5.46-4.486 9.945-10.046 9.945h.004..." />
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.556 4.195 1.613 6.01L.001 24l6.126-1.607a11.966 11.966 0 0 0 5.904 1.554h.005c6.645 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zm0 21.964h-.004a9.982 9.982 0 0 1-5.093-1.39l-.365-.216-3.784.992.997-3.69-.238-.378a9.97 9.97 0 0 1-1.527-5.253C1.986 6.471 6.472 1.985 12.031 1.985c2.658 0 5.158 1.036 7.037 2.915a9.946 9.946 0 0 1 2.915 7.035c0 5.46-4.486 9.945-10.046 9.945zm5.497-6.834c-.302-.151-1.789-.882-2.066-.983-.277-.101-.48-.151-.682.151-.202.302-.782.983-.959 1.184-.176.201-.354.227-.656.076-.302-.151-1.277-.47-2.433-1.503-.9-.804-1.508-1.796-1.684-2.098-.176-.302-.019-.465.132-.616.136-.135.302-.353.454-.529.151-.176.202-.302.302-.503.101-.202.051-.378-.025-.529-.076-.151-.682-1.643-.933-2.247-.245-.591-.497-.509-.682-.518-.176-.008-.378-.01-.58-.01-.202 0-.529.076-.807.378-.277.302-1.059 1.033-1.059 2.518s1.084 2.915 1.236 3.116c.151.202 2.125 3.242 5.144 4.544 2.458 1.063 3.149 1.127 4.226.94 1.144-.197 3.011-1.232 3.435-2.422.422-1.19.422-2.21.296-2.422-.125-.211-.478-.337-.78-.488z" />
                </svg>
                <span className="flex flex-col leading-none">
                    <span className="text-[9px] font-black uppercase tracking-widest text-black/70">Atendimento imediato</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">Quero 10% no Pix</span>
                </span>
            </a>
        </div>
    )
}
