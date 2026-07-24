import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { api, apiError } from "../lib/api";
import ProductCard from "../Components/Products/ProductCard";
import Pagination from "../Components/Shared/Pagination";
import Reveal from "../Components/Shared/Reveal";
import { ProductGridSkeleton, EmptyState, ErrorState } from "../Components/Shared/States";
import { formatPrice } from "../lib/format";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ sizes: [], colors: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get("category") || "";
  const size = params.get("size") || "";
  const color = params.get("color") || "";
  const sort = params.get("sort") || "newest";
  const maxPrice = params.get("maxPrice") || "";
  const page = Number(params.get("page")) || 1;

  // Load categories + facets once.
  useEffect(() => {
    (async () => {
      try {
        const [c, f] = await Promise.all([api.get("/categories"), api.get("/products/facets")]);
        setCategories(c.data || []);
        setFacets(f.data || { sizes: [], colors: [], priceRange: { min: 0, max: 0 } });
      } catch (err) {
        apiError(err);
      }
    })();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/products", {
        params: {
          category: category || undefined,
          size: size || undefined,
          color: color || undefined,
          sort,
          maxPrice: maxPrice || undefined,
          page,
          limit: 12,
        },
      });
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [category, size, color, sort, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!("page" in patch)) next.delete("page"); // reset paging on filter change
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams({}, { replace: true });
  const activeCount = [category, size, color, maxPrice].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-10">
      {/* Category */}
      <div>
        <h3 className="eyebrow mb-4">Category</h3>
        <ul className="space-y-2.5">
          <li>
            <button
              onClick={() => update({ category: "" })}
              className={`text-sm ${!category ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              All pieces
            </button>
          </li>
          {categories.map((c) => (
            <li key={c._id}>
              <button
                onClick={() => update({ category: c._id })}
                className={`text-sm ${category === c._id ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Size */}
      {facets.sizes.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button
                key={s}
                onClick={() => update({ size: size === s ? "" : s })}
                className={`min-w-11 border px-3 py-2 text-xs ${
                  size === s ? "border-ink bg-ink text-bone" : "border-line hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colour */}
      {facets.colors.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">Colour</h3>
          <ul className="space-y-2.5">
            {facets.colors.map((c) => (
              <li key={c.name}>
                <button
                  onClick={() => update({ color: color === c.name ? "" : c.name })}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-line"
                    style={{ background: c.hex }}
                  />
                  <span className={color === c.name ? "text-ink" : "text-muted hover:text-ink"}>{c.name}</span>
                  {color === c.name && <Check size={13} className="text-clay" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price */}
      {facets.priceRange.max > 0 && (
        <div>
          <h3 className="eyebrow mb-4">Max price</h3>
          <input
            type="range"
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            step={500}
            value={maxPrice || facets.priceRange.max}
            onChange={(e) => update({ maxPrice: String(e.target.value) })}
            className="w-full accent-[var(--clay)]"
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{formatPrice(facets.priceRange.min)}</span>
            <span>{formatPrice(maxPrice || facets.priceRange.max)}</span>
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <button onClick={clearAll} className="text-xs font-semibold uppercase tracking-[0.16em] text-clay hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <p className="eyebrow">The collection</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,7vw,5rem)]">All pieces</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 py-5">
        <p className="text-sm text-muted">
          {loading ? "Loading…" : `${pagination.total} ${pagination.total === 1 ? "piece" : "pieces"}`}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <label className="flex items-center gap-2 text-xs">
            <span className="hidden uppercase tracking-[0.14em] text-muted sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="border border-line bg-bone px-3 py-2 text-xs outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterPanel />
          </div>
        </aside>

        {/* Grid */}
        <div>
          {error ? (
            <ErrorState message={typeof error === "string" ? error : undefined} onRetry={fetchProducts} />
          ) : loading ? (
            <ProductGridSkeleton count={9} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No pieces found"
              message="Try adjusting or clearing your filters."
              action={{ to: "/products", label: "Clear filters" }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3">
                {products.map((p, i) => (
                  <Reveal key={p._id} delay={(i % 3) * 60}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onChange={(p) => update({ page: String(p) })}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 [animation:fadeIn_.25s]" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-bone [animation:drawerIn_.35s_var(--ease)]">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="font-display text-2xl">Filters</span>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <FilterPanel />
            </div>
            <div className="border-t border-line p-6">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone"
              >
                View {pagination.total} pieces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
