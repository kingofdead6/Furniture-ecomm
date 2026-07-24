import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiError } from "../lib/api";
import ProductCard from "../Components/Products/ProductCard";
import { ProductGridSkeleton, EmptyState, ErrorState } from "../Components/Shared/States";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!q) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    api
      .get("/products", { params: { search: q, limit: 24 } })
      .then(({ data }) => alive && setProducts(data.products || []))
      .catch((err) => alive && setError(apiError(err)))
      .finally(() => alive && setLoading(false));
    return () => (alive = false);
  }, [q]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Search results</p>
        <h1 className="display mt-2 text-[clamp(2rem,6vw,4rem)]">
          {q ? <>“{q}”</> : "Search"}
        </h1>
        {!loading && !error && q && (
          <p className="mt-3 text-sm text-muted">{products.length} {products.length === 1 ? "result" : "results"}</p>
        )}
      </div>

      <div className="pt-10">
        {!q ? (
          <EmptyState title="What are you looking for?" message="Use the search icon in the header to find pieces." action={{ to: "/products", label: "Browse all" }} />
        ) : error ? (
          <ErrorState message={typeof error === "string" ? error : undefined} />
        ) : loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState title="No results found" message={`We couldn't find anything for “${q}”. Try another term.`} action={{ to: "/products", label: "Browse all" }} />
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
