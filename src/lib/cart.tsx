import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "opcao-natural-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add: (item, quantity = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.id === item.id);
          if (found) {
            return prev.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
            );
          }
          return [...prev, { ...item, quantity }];
        }),
      setQuantity: (id, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.id !== id)
            : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
