import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, apiError } from "../lib/api";
import Reveal from "../Components/Shared/Reveal";
import { Box, ErrorState } from "../Components/Shared/States";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get("/collections")
      .then(({ data }) => setCollections(data || []))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">The lookbook</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,8vw,6rem)]">Collections</h1>
      </div>

      {error ? (
        <ErrorState onRetry={load} />
      ) : loading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Box key={i} className="aspect-[4/3] w-full" />)}
        </div>
      ) : collections.length === 0 ? (
        <p className="py-24 text-center text-muted">No collections yet. Check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2">
          {collections.map((c, i) => (
            <Reveal key={c._id} delay={(i % 2) * 80}>
              <Link to={`/collections/${c.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-paper">
                  {c.heroImage?.url ? (
                    <img
                      src={c.heroImage.url}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted"><span className="eyebrow">No image</span></div>
                  )}
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="eyebrow">{c.season}</p>
                    <h2 className="display mt-1 text-3xl md:text-4xl">{c.name}</h2>
                    {c.subtitle && <p className="mt-1 text-muted">{c.subtitle}</p>}
                  </div>
                  <ArrowRight size={24} className="text-muted transition-all group-hover:translate-x-2 group-hover:text-clay" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
