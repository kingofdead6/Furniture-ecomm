import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, apiError } from "../lib/api";
import { store } from "../store.config.js";
import Reveal from "../Components/Shared/Reveal";
import Marquee from "../Components/Shared/Marquee";
import ProductCard from "../Components/Products/ProductCard";
import { ProductGridSkeleton } from "../Components/Shared/States";

const HERO = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80";
const EDITORIAL = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, c, cats] = await Promise.all([
          api.get("/products", { params: { featured: true, limit: 8 } }),
          api.get("/collections", { params: { featured: true } }),
          api.get("/categories"),
        ]);
        if (!alive) return;
        setFeatured(p.data.products || []);
        setCollections(c.data || []);
        setCategories(cats.data || []);
      } catch (err) {
        apiError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const leadCollection = collections[0];

  return (
    <div>
      {/* ── HERO — asymmetric, type-led ── */}
      <section className="mx-auto grid max-w-[1400px] items-end gap-8 px-5 pb-8 pt-10 md:grid-cols-12 md:px-8 md:pt-16">
        <div className="md:col-span-6 md:pb-10">
          <p className="eyebrow fade-up text-clay" style={{ animationDelay: "60ms" }}>New Season · 2025</p>
          <h1 className="display fade-up mt-5 text-[clamp(3rem,10vw,7.5rem)]" style={{ animationDelay: "140ms" }}>
            Furniture<br />
            made to<br />
            <span className="italic">live</span> with.
          </h1>
          <p className="fade-up mt-6 max-w-md text-muted" style={{ animationDelay: "300ms" }}>{store.brand.tagline}</p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "420ms" }}>
            <Link
              to="/products"
              className="group inline-flex items-center gap-3 bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid"
            >
              Shop everything
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link to="/collections" className="link-underline text-xs font-semibold uppercase tracking-[0.16em]">
              View collections
            </Link>
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="card-media fade-up aspect-[4/5] w-full overflow-hidden bg-paper md:aspect-[3/4]" style={{ animationDelay: "220ms" }}>
            <img src={HERO} alt="Maison living room" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── MARQUEE — the memorable moment ── */}
      <section className="border-y border-line py-6">
        <Marquee items={["New Arrivals", "Solid Timber", "Made to Last", "Cash on Delivery"]} />
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <Reveal className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow">Selected for you</p>
            <h2 className="display mt-2 text-[clamp(2rem,5vw,3.5rem)]">New this season</h2>
          </div>
          <Link to="/products" className="link-underline hidden text-xs font-semibold uppercase tracking-[0.16em] md:inline-block">
            Shop all
          </Link>
        </Reveal>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p._id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── LEAD COLLECTION — full-bleed 2-up ── */}
      {leadCollection && (
        <section className="grid md:grid-cols-2">
          <div className="aspect-[4/5] bg-paper md:aspect-auto">
            <img
              src={leadCollection.heroImage?.url || EDITORIAL}
              alt={leadCollection.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-ink px-6 py-16 text-bone md:px-16">
            <Reveal>
              <p className="eyebrow text-bone/60">{leadCollection.season || "Collection"}</p>
              <h2 className="display mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{leadCollection.name}</h2>
              <p className="mt-5 max-w-md text-bone/70">{leadCollection.description}</p>
              <Link
                to={`/collections/${leadCollection.slug}`}
                className="group mt-8 inline-flex w-fit items-center gap-3 border border-bone/40 px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-bone hover:text-ink"
              >
                Explore
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CATEGORY INDEX — editorial list ── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <Reveal>
            <p className="eyebrow">Departments</p>
            <h2 className="display mt-2 text-[clamp(2rem,5vw,3.5rem)]">Shop by category</h2>
          </Reveal>
          <div className="mt-10 border-t border-line">
            {categories.map((c, i) => (
              <Reveal key={c._id} delay={i * 40}>
                <Link
                  to={`/products?category=${c._id}`}
                  className="group flex items-center justify-between border-b border-line py-6"
                >
                  <span className="font-display text-3xl transition-colors group-hover:text-clay md:text-5xl">
                    {c.name}
                  </span>
                  <ArrowRight
                    size={28}
                    className="text-muted transition-all group-hover:translate-x-2 group-hover:text-clay"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── BRAND STATEMENT ── */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 md:grid-cols-12 md:px-8">
          <Reveal className="md:col-span-7 md:col-start-1">
            <p className="display text-[clamp(1.8rem,4vw,3rem)] leading-[1.1]">
              We make a small number of things, considered down to the joinery — built from honest
              materials, in tones that settle into a room. Buy well. Keep it for years.
            </p>
            <Link to="/about" className="link-underline mt-8 inline-block text-xs font-semibold uppercase tracking-[0.16em]">
              Read our story
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
