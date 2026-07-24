import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../Components/Products/ProductCard";
import { ProductGridSkeleton, EmptyState } from "../Components/Shared/States";

export default function Wishlist() {
  const { isCustomer } = useAuth();
  const { ids } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (isCustomer) {
          const { data } = await api.get("/auth/me/wishlist");
          if (alive) setProducts(data || []);
        } else if (ids.length) {
          // Guest wishlist: resolve each id to a product (best-effort).
          const results = await Promise.allSettled(ids.map((id) => api.get(`/products/${id}`)));
          if (alive) {
            setProducts(results.filter((r) => r.status === "fulfilled").map((r) => r.value.data));
          }
        } else {
          if (alive) setProducts([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
    // Re-run when the id set changes length (add/remove).
  }, [isCustomer, ids.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Saved</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,7vw,5rem)]">Wishlist</h1>
      </div>

      <div className="pt-10">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            message="Tap the heart on any piece to save it for later."
            action={{ to: "/products", label: "Browse the shop" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
