import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Check } from "lucide-react";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import { Box } from "../Components/Shared/States";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.summary || null);
  const [loading, setLoading] = useState(!state?.summary);

  // If we arrived without navigation state (e.g. refresh), try to fetch it.
  // Works for logged-in customers; guests keep the state-passed summary.
  useEffect(() => {
    if (state?.summary) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        if (alive) setOrder(data);
      } catch {
        /* guest without token — nothing to fetch */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [id, state]);

  return (
    <div className="mx-auto max-w-[720px] px-5 py-20 text-center md:px-8">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-ink">
        <Check size={26} />
      </span>
      <p className="eyebrow mt-8 text-clay">Order confirmed</p>
      <h1 className="display mt-3 text-[clamp(2.5rem,7vw,4.5rem)]">Thank you</h1>
      <p className="mt-4 text-muted">
        We've received your order and will call to confirm shortly. Payment is cash on delivery.
      </p>

      {loading ? (
        <Box className="mx-auto mt-10 h-40 w-full max-w-md" />
      ) : order ? (
        <div className="mx-auto mt-10 max-w-md border border-line p-8 text-left">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <span className="eyebrow">Order</span>
            <span className="font-display text-xl">{order.orderNumber}</span>
          </div>
          {order.items && (
            <div className="divide-y divide-line py-2">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between py-3 text-sm">
                  <span>
                    {i.name}
                    <span className="text-muted"> × {i.quantity}</span>
                  </span>
                  <span>{formatPrice((i.price || 0) * i.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm uppercase tracking-[0.14em]">Total</span>
            <span className="font-display text-2xl">{formatPrice(order.totalPrice)}</span>
          </div>
          {order.wilaya && (
            <p className="mt-4 text-xs text-muted">
              {order.deliveryType === "home" ? "Home delivery" : "Pickup"} · {order.wilaya}
              {order.desk ? ` · ${order.desk}` : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">Your order reference is #{id.slice(-8).toUpperCase()}.</p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/products" className="bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid">
          Continue shopping
        </Link>
        <Link to="/account" className="border border-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] btn-line">
          View my orders
        </Link>
      </div>
    </div>
  );
}
