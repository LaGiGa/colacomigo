import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartStore } from '@/types/cart.types'

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
                        // Incrementa quantidade se já existir
                        const updated = [...state.items]
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            quantity: updated[existingIndex].quantity + 1,
                        }
                        return { items: updated }
                    }
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
                        i.variantId === variantId ? { ...i, quantity } : i
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
