import { useCallback, useEffect, useState } from "react";
import { CartItem, MenuItem } from "../types";

function cartKey(slug: string | null | undefined): string | null {
  return slug ? `dms_cart_${slug}` : null;
}

function readCart(key: string | null): CartItem[] {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function useCart(slug: string | null | undefined) {
  const key = cartKey(slug);
  const [items, setItems] = useState<CartItem[]>(() => readCart(key));

  useEffect(() => {
    setItems(readCart(key));
  }, [key]);

  const persist = useCallback(
    (next: CartItem[]) => {
      setItems(next);
      if (key) localStorage.setItem(key, JSON.stringify(next));
    },
    [key]
  );

  const addItem = useCallback(
    (item: MenuItem, quantity: number) => {
      if (!key) return;
      const current = readCart(key);
      const existing = current.find((i) => i.menu_item_id === item.id);
      const next = existing
        ? current.map((i) =>
            i.menu_item_id === item.id ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [
            ...current,
            {
              menu_item_id: item.id,
              name: item.name,
              price: item.price,
              image_url: item.image_url,
              quantity,
            },
          ];
      persist(next);
    },
    [key, persist]
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      const current = readCart(key);
      if (quantity <= 0) {
        persist(current.filter((i) => i.menu_item_id !== menuItemId));
        return;
      }
      persist(current.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity } : i)));
    },
    [key, persist]
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      persist(readCart(key).filter((i) => i.menu_item_id !== menuItemId));
    },
    [key, persist]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clear, count, subtotal };
}
