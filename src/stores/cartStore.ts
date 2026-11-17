import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  slug: string;
  title: string;
  image: string | null;
  price: { amount: string; currencyCode: "BRL" };
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (slug: string, quantity: number) => Promise<void>;
  removeItem: (slug: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      addItem: async (item) => {
        set({ isLoading: true });
        try {
          const current = get().items.find((entry) => entry.slug === item.slug);
          set({
            items: current
              ? get().items.map((entry) =>
                  entry.slug === item.slug
                    ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, 99) }
                    : entry,
                )
              : [...get().items, { ...item, quantity: Math.min(item.quantity, 99) }],
          });
        } finally {
          set({ isLoading: false });
        }
      },
      updateQuantity: async (slug, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(slug);
          return;
        }
        set({
          items: get().items.map((entry) =>
            entry.slug === slug ? { ...entry, quantity: Math.min(quantity, 99) } : entry,
          ),
        });
      },
      removeItem: async (slug) => {
        set({ items: get().items.filter((entry) => entry.slug !== slug) });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "opcao-natural-stripe-cart",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
