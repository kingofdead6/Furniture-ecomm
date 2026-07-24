import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, apiError } from "../lib/api";
import ProductCard from "../Components/Products/ProductCard";
import Reveal from "../Components/Shared/Reveal";
import { ProductGridSkeleton, ErrorState, EmptyState } from "../Components/Shared/States";

export default function CollectionDetail() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get(`/collections/${slug}`)
      .then(({ data }) => setCollection(data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <ErrorState onRetry={load} />
      </div>
    );
  }

  return (
    <div>
      {/* Full-bleed hero */}
      <section className="relative">
        <div className="aspect-[16/10] w-full bg-paper md:aspect-[21/9]">
          {collection?.heroImage?.url && (
            <img src={collection.heroImage.url} alt={collection.name} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-6 text-bone md:p-14">
          <p className="eyebrow text-bone/70">{collection?.season || "Collection"}</p>
          <h1 className="display mt-3 text-[clamp(2.5rem,9vw,7rem)]">{collection?.name || "…"}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
        {collection?.description && (
          <p className="display mb-16 max-w-3xl text-[clamp(1.4rem,3vw,2.2rem)] leading-[1.15]">
            {collection.description}
          </p>
        )}

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : collection?.products?.length === 0 ? (
          <EmptyState title="Nothing here yet" message="Pieces for this collection are coming soon." action={{ to: "/products", label: "Shop all" }} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">
            {collection?.products?.map((p, i) => (
              <Reveal key={p._id} delay={(i % 4) * 50}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link to="/collections" className="link-underline text-xs font-semibold uppercase tracking-[0.16em]">
            All collections
          </Link>
        </div>
      </div>
    </div>
  );
}
