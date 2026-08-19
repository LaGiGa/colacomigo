import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartStore } from '@/types/cart.types'

/** Teto de unidades de uma variante: o estoque informado (quando existir). */
function maxFor(item: { stock?: number }) {
    return typeof item.stock === 'number' && item.stock >= 0 ? item.stock : Number.POSITIVE_INFINITY
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                set((state) => {
                    const existingIndex = state.items.findIndex(
                        (i) => i.variantId === newItem.variantId
                    )
                    if (existingIndex >= 0) {
                        // Incrementa a quantidade, respeitando o estoque disponível
                        const current = state.items[existingIndex]
                        const limit = maxFor(newItem)
                        const updated = [...state.items]
                        updated[existingIndex] = {
                            ...current,
                            stock: newItem.stock ?? current.stock,
                            quantity: Math.min(current.quantity + 1, limit),
                        }
                        return { items: updated }
                    }
                    if (maxFor(newItem) < 1) return { items: state.items }
                    return { items: [...state.items, { ...newItem, quantity: 1 }] }
                })
            },

            removeItem: (variantId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.variantId !== variantId),
                }))
            },

            updateQuantity: (variantId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(variantId)
                    return
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.variantId === variantId
                            ? { ...i, quantity: Math.min(quantity, maxFor(i)) }
                            : i
                    ),
                }))
            },

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            subtotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        {
            name: 'urbanstore-cart',        // chave no localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
)
