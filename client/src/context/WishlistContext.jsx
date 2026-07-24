import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

// Wishlist is server-backed for logged-in customers and falls back to
// localStorage for guests. Exposes a set of product ids for quick membership
// checks plus a toggle that routes to the right store.

const WishlistContext = createContext(null);
const KEY = "wishlist";

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const { isCustomer } = useAuth();
  const [ids, setIds] = useState(readGuest);

  const loadServer = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me/wishlist");
      setIds(data.map((p) => p._id));
    } catch {
      /* ignore — falls back to whatever is in state */
    }
  }, []);

  useEffect(() => {
    if (isCustomer) loadServer();
    else setIds(readGuest());
  }, [isCustomer, loadServer]);

  useEffect(() => {
    if (!isCustomer) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, isCustomer]);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(
    async (id) => {
      // Optimistic update either way.
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      if (isCustomer) {
        try {
          await api.post("/auth/me/wishlist", { productId: id });
        } catch {
          loadServer(); // reconcile on failure
        }
      }
    },
    [isCustomer, loadServer]
  );

  return (
    <WishlistContext.Provider value={{ ids, has, toggle, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
