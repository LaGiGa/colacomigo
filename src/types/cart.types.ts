export interface CartItem {
    variantId: string
    productId: string
    productName: string
    productSlug: string
    variantSku: string
    size: string | null
    colorName: string | null
    colorHex: string | null
    price: number        // preço final (product.price + variant.price_delta)
    imageUrl: string | null
    quantity: number
}

export interface CartStore {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (variantId: string) => void
    updateQuantity: (variantId: string, quantity: number) => void
    clearCart: () => void
    // Seletores
    totalItems: () => number
    subtotal: () => number
}
