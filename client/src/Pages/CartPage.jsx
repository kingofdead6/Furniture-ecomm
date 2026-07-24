import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import { EmptyState } from "../Components/Shared/States";

export default function CartPage() {
  const { items, updateQty, remove, subtotal, count, lineKey } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <EmptyState
          title="Your bag is empty"
          message="Once you add pieces you love, they'll appear here."
          action={{ to: "/products", label: "Start shopping" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">{count} {count === 1 ? "item" : "items"}</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,7vw,5rem)]">Shopping bag</h1>
      </div>

      <div className="grid gap-12 pt-10 lg:grid-cols-[1fr_360px]">
        {/* Lines */}
        <div>
          {items.map((item) => {
            const key = lineKey(item);
            return (
              <div key={key} className="flex gap-5 border-b border-line py-6">
                <Link to={`/products/${item.productId}`} className="block h-36 w-28 shrink-0 bg-paper">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/products/${item.productId}`} className="font-display text-xl leading-tight">
                        {item.name}
                      </Link>
                      {(item.color || item.size) && (
                        <p className="mt-1.5 text-xs uppercase tracking-wide text-muted">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button onClick={() => remove(key)} aria-label="Remove item" className="text-muted hover:text-clay">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center border border-line">
                      <button onClick={() => updateQty(key, item.quantity - 1)} className="grid h-10 w-10 place-items-center hover:bg-paper" aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(key, item.quantity + 1)} className="grid h-10 w-10 place-items-center hover:bg-paper" aria-label="Increase">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-base">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <Link to="/products" className="link-underline mt-8 inline-block text-xs font-semibold uppercase tracking-[0.16em]">
            Continue shopping
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-line p-8">
            <h2 className="font-display text-2xl">Order summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="text-muted">Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-6 flex items-baseline justify-between border-t border-line pt-6">
              <span className="text-sm uppercase tracking-[0.14em]">Total</span>
              <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-6 block bg-ink py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid"
            >
              Proceed to checkout
            </Link>
            <p className="mt-4 text-center text-xs text-muted">Cash on delivery · Returns within 14 days</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
