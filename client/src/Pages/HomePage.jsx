import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { api, apiError } from "../lib/api";
import { store } from "../store.config.js";
import { useParallax, useMagnetic } from "../lib/motion";
import Reveal from "../Components/Shared/Reveal";
import Marquee from "../Components/Shared/Marquee";
import SplitText from "../Components/Shared/SplitText";
import HoverPreviewList from "../Components/Shared/HoverPreviewList";
import ShopTheRoom from "../Components/Shared/ShopTheRoom";
import ProductCard from "../Components/Products/ProductCard";
import { ProductGridSkeleton } from "../Components/Shared/States";

const HERO = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80";
const EDITORIAL = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80";
const ROOM = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=80";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroImage = useParallax(70);
  const editorialImage = useParallax(48);
  const heroCta = useMagnetic(0.22);

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

  // Category rows for the hover-preview index. Falls back to a product photo
  // from that category when a category has no image of its own.
  const categoryRows = useMemo(
    () =>
      categories.map((c, i) => ({
        id: c._id,
        index: String(i + 1).padStart(2, "0"),
        label: c.name,
        to: `/products?category=${c._id}`,
        image:
          c.image?.url ||
          featured.find((p) => p.category?._id === c._id)?.images?.[0]?.url ||
          null,
      })),
    [categories, featured]
  );

  return (
    <div>
      {/* ── HERO — type-led, masked word reveal, parallax scene ── */}
      <section className="mx-auto grid max-w-[1400px] items-end gap-8 px-5 pb-8 pt-10 md:grid-cols-12 md:px-8 md:pt-16">
        <div className="md:col-span-6 md:pb-10">
          <p className="eyebrow fade-up text-clay" style={{ animationDelay: "60ms" }}>
            New Season · 2025
          </p>
          <h1 className="display mt-5 text-[clamp(3rem,10vw,7.5rem)]">
            <SplitText text="Furniture" delay={180} stagger={80} className="block" />
            <SplitText text="made to" delay={280} stagger={80} className="block" />
            <span className="block">
              <SplitText text="live" delay={420} className="italic" />{" "}
              <SplitText text="with." delay={500} />
            </span>
          </h1>
          <p className="fade-up mt-6 max-w-md text-muted" style={{ animationDelay: "700ms" }}>
            {store.brand.tagline}
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "820ms" }}>
            <Link
              ref={heroCta}
              to="/products"
              className="magnetic group inline-flex items-center gap-3 bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid"
            >
              Shop everything
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link to="/collections" className="link-underline text-xs font-semibold uppercase tracking-[0.16em]">
              View collections
            </Link>
          </div>

          <div className="fade-up mt-14 hidden items-center gap-3 text-muted md:flex" style={{ animationDelay: "1000ms" }}>
            <ArrowDown size={15} />
            <span className="text-[11px] uppercase tracking-[0.22em]">Scroll</span>
            <span className="h-px w-16 bg-line" />
          </div>
        </div>

        <div className="md:col-span-6">
          <div className="card-media fade-up aspect-[4/5] w-full overflow-hidden bg-paper md:aspect-[3/4]" style={{ animationDelay: "220ms" }}>
            <img
              ref={heroImage}
              src={HERO}
              alt="Maison living room"
              className="parallax h-[118%] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <section className="border-y border-line py-6">
        <Marquee items={["New Arrivals", "Solid Timber", "Made to Last", "Cash on Delivery"]} />
      </section>

      {/* ── FEATURED — deliberately offset editorial grid ── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <Reveal className="mb-12 flex items-end justify-between">
          <div>
            <p className="eyebrow">Selected for you</p>
            <SplitText
              as="h2"
              onScroll
              text="New this season"
              className="display mt-2 block text-[clamp(2rem,5vw,3.5rem)]"
            />
          </div>
          <Link to="/products" className="link-underline hidden text-xs font-semibold uppercase tracking-[0.16em] md:inline-block">
            Shop all
          </Link>
        </Reveal>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid-editorial grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-y-6">
            {featured.map((p, i) => (
              <Reveal key={p._id} delay={(i % 4) * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── SHOP THE ROOM — interactive hotspots ── */}
      {!loading && <ShopTheRoom image={ROOM} products={featured} />}

      {/* ── LEAD COLLECTION — full-bleed 2-up ── */}
      {leadCollection && (
        <section className="grid md:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden bg-paper md:aspect-auto">
            <img
              ref={editorialImage}
              src={leadCollection.heroImage?.url || EDITORIAL}
              alt={leadCollection.name}
              className="parallax h-[112%] w-full object-cover"
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
                <ArrowRight size={16} className="btn-arrow" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CATEGORY INDEX — cursor-following preview ── */}
      {categoryRows.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <Reveal className="mb-10">
            <p className="eyebrow">Departments</p>
            <SplitText
              as="h2"
              onScroll
              text="Shop by category"
              className="display mt-2 block text-[clamp(2rem,5vw,3.5rem)]"
            />
          </Reveal>
          <HoverPreviewList items={categoryRows} />
        </section>
      )}

      {/* ── BRAND STATEMENT ── */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 md:grid-cols-12 md:px-8">
          <Reveal className="md:col-span-8 md:col-start-1">
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
