import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Cart lives in localStorage under "cart" (the existing contract) but each line
// now carries variant info. A line is keyed by productId + variantId so the same
// product in two sizes is two lines. Other tabs/components stay in sync via the
// "cartUpdated" window event.

const CartContext = createContext(null);
const KEY = "cart";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const lineKey = (i) => `${i.productId}::${i.variantId || "default"}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);

  // Persist + broadcast on every change.
  useEffect(() => {
    if (items.length > 0) localStorage.setItem(KEY, JSON.stringify(items));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("cartUpdated"));
  }, [items]);

  // React to changes coming from other tabs / the old event contract.
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("storage", sync);
    window.addEventListener("cartUpdated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cartUpdated", sync);
    };
  }, []);

  const add = useCallback((line, qty = 1) => {
    setItems((prev) => {
      const key = lineKey(line);
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) {
        const cap = line.maxStock ?? Infinity;
        return prev.map((i) =>
          lineKey(i) === key ? { ...i, quantity: Math.min(cap, i.quantity + qty) } : i
        );
      }
      return [...prev, { ...line, quantity: Math.min(line.maxStock ?? Infinity, qty) }];
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (lineKey(i) !== key) return i;
          const cap = i.maxStock ?? Infinity;
          return { ...i, quantity: Math.max(1, Math.min(cap, qty)) };
        })
        .filter((i) => i.quantity >= 1)
    );
  }, []);

  const remove = useCallback((key) => {
    setItems((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + (i.quantity || 1), 0);
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{ items, add, updateQty, remove, clear, count, subtotal, lineKey }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
