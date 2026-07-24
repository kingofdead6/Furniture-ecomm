import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/format";

// Slide-over cart. Reads the shared CartContext so quantity edits here reflect
// everywhere instantly. Delivery is quoted at checkout (wilaya-dependent).
export default function CartDrawer({ open, onClose }) {
  const { items, updateQty, remove, subtotal, count, lineKey } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-ink/40 [animation:fadeIn_.25s]" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-[min(440px,94vw)] flex-col bg-bone [animation:drawerIn_.35s_var(--ease)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-2xl">
            Shopping bag <span className="text-base text-muted">({count})</span>
          </h2>
          <button onClick={onClose} aria-label="Close cart" className="p-1 text-muted hover:text-ink">
            <X size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted">Add pieces you love and they'll appear here.</p>
            <Link
              to="/products"
              onClick={onClose}
              className="mt-8 border border-ink px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] btn-line"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => {
                const key = lineKey(item);
                return (
                  <div key={key} className="flex gap-4 border-b border-line py-5">
                    <Link to={`/products/${item.productId}`} onClick={onClose} className="block h-28 w-20 shrink-0 bg-paper">
                      {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link to={`/products/${item.productId}`} onClick={onClose} className="font-display text-lg leading-tight">
                          {item.name}
                        </Link>
                        <button onClick={() => remove(key)} aria-label="Remove" className="text-muted hover:text-clay">
                          <X size={16} />
                        </button>
                      </div>
                      {(item.size || item.color) && (
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-line">
                          <button
                            onClick={() => updateQty(key, item.quantity - 1)}
                            className="grid h-8 w-8 place-items-center hover:bg-paper"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(key, item.quantity + 1)}
                            className="grid h-8 w-8 place-items-center hover:bg-paper"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-[0.14em] text-muted">Subtotal</span>
                <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Delivery calculated at checkout.</p>
              <Link
                to="/checkout"
                onClick={onClose}
                className="mt-5 block bg-ink py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid"
              >
                Checkout
              </Link>
              <button
                onClick={onClose}
                className="mt-3 block w-full text-center text-xs uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
