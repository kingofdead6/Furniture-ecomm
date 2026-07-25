import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Heart, Ruler, Minus, Plus, ChevronRight } from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import Reveal from "../Components/Shared/Reveal";
import Stars from "../Components/Shared/Stars";
import ProductCard from "../Components/Products/ProductCard";
import SizeGuide from "../Components/Products/SizeGuide";
import { Box, ProductGridSkeleton, ErrorState } from "../Components/Shared/States";

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { isCustomer, profile } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [accordion, setAccordion] = useState("details");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    setColor("");
    setSize("");
    setQty(1);
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (!alive) return;
        setProduct(data);
        if (data.colors?.length === 1) setColor(data.colors[0].name);
        const [rel, rev] = await Promise.all([
          api.get(`/products/${id}/related`),
          api.get(`/reviews/product/${id}`),
        ]);
        if (!alive) return;
        setRelated(rel.data || []);
        setReviews(rev.data || []);
      } catch (err) {
        if (alive) setError(apiError(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [id]);

  const hasVariants = product?.variants?.length > 0;

  // Sizes available for the chosen colour (or all, when no colour chosen).
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (!hasVariants) return [];
    const set = new Map();
    for (const v of product.variants) {
      if (color && v.color !== color) continue;
      // Keep the highest stock seen per size.
      set.set(v.size, Math.max(set.get(v.size) || 0, v.stock));
    }
    return [...set.entries()].map(([s, stock]) => ({ size: s, stock }));
  }, [product, color, hasVariants]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return product.variants.find((v) => v.color === color && v.size === size) || null;
  }, [product, color, size, hasVariants]);

  const price = selectedVariant?.priceOverride ?? product?.price ?? 0;
  const onSale = product?.compareAtPrice && product.compareAtPrice > product.price;
  const maxStock = hasVariants ? selectedVariant?.stock ?? 0 : product?.stock ?? 0;
  const canAdd = hasVariants ? Boolean(selectedVariant) && maxStock > 0 : (product?.stock ?? 0) > 0;

  const addToCart = () => {
    if (hasVariants && !color) return toast.error("Please choose a colour");
    if (hasVariants && !size) return toast.error("Please choose a size");
    if (!canAdd) return toast.error("Out of stock");
    add(
      {
        productId: product._id,
        variantId: selectedVariant?._id || null,
        name: product.name,
        slug: product.slug,
        price,
        image: product.images?.[0]?.url || null,
        size: size || null,
        color: color || null,
        maxStock,
      },
      qty
    );
    toast.success("Added to your cart");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <Box className="aspect-[3/4] w-full" />
          <div className="space-y-4">
            <Box className="h-4 w-1/4" />
            <Box className="h-10 w-3/4" />
            <Box className="h-5 w-1/3" />
            <Box className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
        <ErrorState message={typeof error === "string" ? error : "This piece could not be found."} />
        <div className="text-center">
          <Link to="/products" className="link-underline text-xs font-semibold uppercase tracking-[0.16em]">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ url: null, alt: product.name }];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-5 py-5 text-xs text-muted md:px-8">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-ink">Shop</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{product.name}</span>
      </div>

      {/* Split scroll */}
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 md:px-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          {images.map((img, i) => (
            <div key={i} className="aspect-[3/4] w-full bg-paper">
              {img.url ? (
                <img src={img.url} alt={img.alt || product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted"><span className="eyebrow">No image</span></div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky info */}
        <div className="lg:h-fit lg:sticky lg:top-28 lg:pt-2">
          <p className="eyebrow">{product.category?.name}</p>
          <h1 className="display mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">{product.name}</h1>

          {product.ratingCount > 0 && (
            <div className="mt-3">
              <Stars value={product.ratingAvg} count={product.ratingCount} />
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-xl">{formatPrice(price)}</span>
            {onSale && <span className="text-muted line-through">{formatPrice(product.compareAtPrice)}</span>}
          </div>

          {product.description && <p className="mt-6 max-w-md text-muted">{product.description}</p>}

          {/* Colour */}
          {hasVariants && product.colors?.length > 0 && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <h3 className="eyebrow">Finish{color && <span className="ml-2 normal-case tracking-normal text-ink">— {color}</span>}</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setColor(c.name); setSize(""); }}
                    aria-label={c.name}
                    aria-pressed={color === c.name}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      color === c.name ? "border-ink" : "border-line hover:border-muted"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {hasVariants && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <h3 className="eyebrow">Size</h3>
                <button onClick={() => setGuideOpen(true)} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink">
                  <Ruler size={14} /> Dimensions
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSizes.map(({ size: s, stock }) => (
                  <button
                    key={s}
                    disabled={stock <= 0}
                    onClick={() => setSize(s)}
                    className={`relative min-w-12 border px-3 py-2.5 text-sm transition ${
                      size === s
                        ? "border-ink bg-ink text-bone"
                        : stock <= 0
                        ? "cursor-not-allowed border-line text-muted/40 line-through"
                        : "border-line hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {selectedVariant && maxStock > 0 && maxStock <= 5 && (
                <p className="mt-3 text-xs text-clay">Only {maxStock} left in this option.</p>
              )}
            </div>
          )}

          {/* Quantity + add */}
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border border-line">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center hover:bg-paper" aria-label="Decrease">
                <Minus size={15} />
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxStock || Infinity, q + 1))}
                className="grid h-12 w-12 place-items-center hover:bg-paper"
                aria-label="Increase"
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={!canAdd}
              className="flex-1 bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition-colors enabled:hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40"
            >
              {canAdd || !hasVariants ? "Add to cart" : "Select options"}
            </button>
            <button
              onClick={() => toggle(product._id)}
              aria-label="Wishlist"
              className="grid w-14 place-items-center border border-line hover:border-ink"
            >
              <Heart size={18} className={has(product._id) ? "fill-clay text-clay" : ""} />
            </button>
          </div>
          {!canAdd && (!hasVariants ? product.stock <= 0 : selectedVariant && maxStock <= 0) && (
            <p className="mt-3 text-sm text-clay">This option is currently sold out.</p>
          )}

          {/* Accordions */}
          <div className="mt-10 border-t border-line">
            {[
              { key: "details", label: "Details", body: product.details || product.description },
              { key: "material", label: "Material & Care", body: [product.material, product.care].filter(Boolean).join("\n") },
              { key: "delivery", label: "Delivery & Assembly", body: "Cash on delivery across Algeria — cost is calculated at checkout by wilaya. Smaller items ship in 2–5 days; larger pieces are made to order (2–4 weeks). Most items arrive flat-packed; in-home assembly is available on request in major cities. Returns within 14 days on unused, repackaged items." },
            ].map((row) => (
              <div key={row.key} className="border-b border-line">
                <button
                  onClick={() => setAccordion(accordion === row.key ? "" : row.key)}
                  className="flex w-full items-center justify-between py-4 text-left"
                  aria-expanded={accordion === row.key}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.12em]">{row.label}</span>
                  {accordion === row.key ? <Minus size={16} /> : <Plus size={16} />}
                </button>
                {accordion === row.key && row.body && (
                  <p className="whitespace-pre-line pb-5 text-sm leading-relaxed text-muted">{row.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection
        productId={product._id}
        reviews={reviews}
        setReviews={setReviews}
        defaultName={isCustomer ? profile?.name : ""}
      />

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <h2 className="display mb-10 text-[clamp(1.8rem,4vw,3rem)]">You may also like</h2>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function ReviewSection({ productId, reviews, setReviews, defaultName }) {
  const [form, setForm] = useState({ name: "", rating: 0, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (defaultName) setForm((f) => ({ ...f, name: defaultName }));
  }, [defaultName]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rating) {
      return toast.error("Please add your name and a rating");
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/reviews", { product: productId, ...form });
      setReviews((prev) => [data, ...prev]);
      setForm({ name: defaultName || "", rating: 0, title: "", body: "" });
      setOpen(false);
      toast.success("Thank you for your review");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="display mt-2 text-[clamp(1.8rem,4vw,3rem)]">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </h2>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="border border-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] btn-line"
          >
            Write a review
          </button>
        </div>

        {open && (
          <form onSubmit={submit} className="mt-8 max-w-lg space-y-4 border border-line p-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Your rating</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                    aria-label={`${n} stars`}
                    className={`px-0.5 text-2xl ${n <= form.rating ? "text-ink" : "text-muted/40"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title (optional)"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Tell others what you think"
              rows={4}
              className="w-full resize-none border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-ink px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-bone disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}

        <div className="mt-12 divide-y divide-line border-t border-line">
          {reviews.length === 0 ? (
            <p className="py-10 text-muted">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="grid gap-2 py-8 md:grid-cols-[200px_1fr]">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  {r.verified && <p className="mt-1 text-xs uppercase tracking-wide text-clay">Verified buyer</p>}
                </div>
                <div>
                  <Stars value={r.rating} />
                  {r.title && <p className="mt-2 font-display text-lg">{r.title}</p>}
                  {r.body && <p className="mt-1 text-muted">{r.body}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
