import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { useWishlist } from "../../context/WishlistContext";

// Editorial product card: tall quiet image, second image revealed on hover
// (the Shop page's memorable moment), price + optional markdown, wishlist toggle.
export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const primary = product.images?.[0]?.url;
  const secondary = product.images?.[1]?.url;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const soldOut = (product.stock ?? 0) <= 0;
  const wished = has(product._id);

  return (
    <article className="group">
      <div className="relative">
        <Link
          to={`/products/${product._id}`}
          className="img-swap block aspect-[3/4] bg-paper"
          aria-label={product.name}
        >
          {primary ? (
            <>
              <img
                src={primary}
                alt={product.images?.[0]?.alt || product.name}
                loading="lazy"
                className="img-primary h-full w-full object-cover"
              />
              {secondary && (
                <img
                  src={secondary}
                  alt=""
                  loading="lazy"
                  className="img-secondary h-full w-full object-cover"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <span className="eyebrow">No image</span>
            </div>
          )}

          {/* Corner marks */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {onSale && (
              <span className="bg-clay px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-bone">
                Sale
              </span>
            )}
            {soldOut && (
              <span className="bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-bone">
                Sold out
              </span>
            )}
          </div>
        </Link>

        <button
          onClick={() => toggle(product._id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-bone/70 backdrop-blur-sm transition-colors hover:bg-bone"
        >
          <Heart size={16} strokeWidth={1.6} className={wished ? "fill-clay text-clay" : "text-ink"} />
        </button>
      </div>

      <div className="mt-4">
        <p className="eyebrow">{product.category?.name || "Atelier"}</p>
        <h3 className="mt-1 font-display text-lg leading-tight">
          <Link to={`/products/${product._id}`} className="link-underline">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm">{formatPrice(product.price)}</span>
          {onSale && (
            <span className="text-xs text-muted line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
