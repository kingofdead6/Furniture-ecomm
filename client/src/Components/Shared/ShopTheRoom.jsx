import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { formatPrice } from "../../lib/format";

// An interactive room scene: numbered hotspots sit over a photograph and reveal
// the product they point at. Hotspots are real buttons — keyboard focus opens
// the same card a hover does, and each card contains a link to the product.
export default function ShopTheRoom({ image, products = [], spots }) {
  const [open, setOpen] = useState(null);

  // Default hotspot positions (% of the image box). Paired with however many
  // products we were given, so the section degrades gracefully.
  const positions = spots || [
    { x: 30, y: 62 },
    { x: 62, y: 45 },
    { x: 78, y: 72 },
    { x: 45, y: 30 },
  ];

  const pinned = products.slice(0, positions.length);
  if (!image || pinned.length === 0) return null;

  return (
    <section className="border-y border-line bg-paper/40">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 md:px-8 lg:grid-cols-[1fr_340px] lg:items-center">
        {/* Scene — the image clips inside its own box so hotspot cards, which
            sit outside it, are never cut off. */}
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden bg-paper">
            <img src={image} alt="A room styled with Maison pieces" className="h-full w-full object-cover" />
          </div>

          {pinned.map((p, i) => {
            const pos = positions[i];
            const isOpen = open === i;
            // Markers in the upper part of the scene open downwards so the card
            // never runs off the top of the section.
            const below = pos.y < 45;
            return (
              <div key={p._id}>
                <button
                  className={`hotspot ${isOpen ? "is-active" : ""}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  aria-label={`Show ${p.name}`}
                  aria-expanded={isOpen}
                  onPointerEnter={() => setOpen(i)}
                  onFocus={() => setOpen(i)}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <Plus size={16} strokeWidth={2} />
                </button>

                <div
                  className={`hotspot-card ${below ? "is-below" : ""} ${isOpen ? "is-on" : ""}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onPointerLeave={() => setOpen((o) => (o === i ? null : o))}
                >
                  <Link to={`/products/${p._id}`} className="block">
                    <div className="aspect-[4/3] bg-paper">
                      {p.images?.[0]?.url && (
                        <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="eyebrow">{p.category?.name}</p>
                      <p className="mt-1 font-display text-base leading-tight">{p.name}</p>
                      <p className="mt-1 text-sm">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Copy */}
        <div>
          <p className="eyebrow text-clay">Shop the room</p>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3.2rem)]">
            One room,<br />four decisions.
          </h2>
          <p className="mt-4 text-muted">
            Every piece here was chosen to sit together — tone, timber and proportion. Tap a marker
            to see what's in the scene.
          </p>
          <ul className="mt-7 space-y-2.5">
            {pinned.map((p, i) => (
              <li key={p._id}>
                <button
                  onPointerEnter={() => setOpen(i)}
                  onClick={() => setOpen(i)}
                  className={`flex w-full items-baseline gap-3 text-left text-sm transition-colors ${
                    open === i ? "text-clay" : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{p.name}</span>
                  <span>{formatPrice(p.price)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            to="/products"
            className="group mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] link-underline"
          >
            Shop everything <ArrowRight size={15} className="btn-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
