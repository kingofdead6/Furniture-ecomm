import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, ChevronLeft } from "lucide-react";
import { api, apiError } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../lib/format";

const STEPS = ["Information", "Delivery", "Review"];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { isCustomer, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [coupon, setCoupon] = useState({ code: "", applied: null, checking: false, error: "" });
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    customerEmail: "",
    wilaya: "",
    deliveryType: "desk",
    desk: "",
    address: "",
  });

  // Redirect out if the bag is empty.
  useEffect(() => {
    if (items.length === 0) navigate("/cart", { replace: true });
  }, [items.length, navigate]);

  // Prefill from customer profile + default address.
  useEffect(() => {
    if (!isCustomer || !profile) return;
    const def = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0];
    setForm((f) => ({
      ...f,
      customerName: f.customerName || profile.name || "",
      customerEmail: f.customerEmail || profile.email || "",
      phone: f.phone || profile.phone || "",
      ...(def
        ? { wilaya: def.wilaya || "", deliveryType: def.deliveryType || "desk", desk: def.desk || "", address: def.address || "" }
        : {}),
    }));
  }, [isCustomer, profile]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/delivery-areas");
        setAreas(data.areas || []);
      } catch (err) {
        toast.error(apiError(err, "Couldn't load delivery areas"));
      } finally {
        setLoadingAreas(false);
      }
    })();
  }, []);

  const selectedArea = areas.find((a) => a.wilaya === form.wilaya);
  const desks = selectedArea?.desks || [];
  const shipping = selectedArea ? (form.deliveryType === "home" ? selectedArea.priceHome : selectedArea.priceDesk) : null;

  const discount = coupon.applied?.freeShipping ? 0 : coupon.applied?.discount || 0;
  const shippingAfter = coupon.applied?.freeShipping ? 0 : shipping;
  const total = Math.max(0, subtotal - discount) + (shippingAfter || 0);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.customerName.trim() || !form.phone.trim()) {
        toast.error("Please enter your name and phone number");
        return false;
      }
    }
    if (step === 1) {
      if (!form.wilaya) return toast.error("Please select your wilaya"), false;
      if (form.deliveryType === "desk" && !form.desk) return toast.error("Please choose a pickup point"), false;
      if (form.deliveryType === "home" && !form.address.trim()) return toast.error("Please enter your address"), false;
    }
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const applyCoupon = async () => {
    if (!coupon.code.trim()) return;
    setCoupon((c) => ({ ...c, checking: true, error: "" }));
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon.code, subtotal });
      if (data.valid) {
        setCoupon((c) => ({ ...c, applied: data, error: "" }));
        toast.success("Coupon applied");
      } else {
        setCoupon((c) => ({ ...c, applied: null, error: data.message }));
      }
    } catch (err) {
      setCoupon((c) => ({ ...c, applied: null, error: apiError(err) }));
    } finally {
      setCoupon((c) => ({ ...c, checking: false }));
    }
  };

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    try {
      const { data } = await api.post("/orders/create", {
        customerName: form.customerName,
        phone: form.phone,
        customerEmail: form.customerEmail || undefined,
        wilaya: form.wilaya,
        deliveryType: form.deliveryType,
        desk: form.deliveryType === "desk" ? form.desk : undefined,
        address: form.deliveryType === "home" ? form.address : undefined,
        couponCode: coupon.applied?.code || undefined,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      });
      const summary = {
        orderNumber: data.orderNumber,
        totalPrice: data.totalPrice,
        items,
        customerName: form.customerName,
        wilaya: form.wilaya,
        deliveryType: form.deliveryType,
        desk: form.desk,
        address: form.address,
      };
      clear();
      navigate(`/order/${data.orderId}`, { state: { summary }, replace: true });
    } catch (err) {
      toast.error(apiError(err, "Couldn't place your order"));
      setPlacing(false);
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3.5 text-sm outline-none transition-colors focus:border-ink";
  const labelCls = "eyebrow mb-2 block";

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-8">
      <Link to="/cart" className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-ink">
        <ChevronLeft size={15} /> Back to cart
      </Link>
      <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4rem)]">Checkout</h1>

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2 md:gap-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
                  i < step ? "border-ink bg-ink text-bone" : i === step ? "border-ink" : "border-line text-muted"
                }`}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              <span className={`text-xs uppercase tracking-[0.12em] ${i === step ? "text-ink" : "text-muted"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        {/* Step body */}
        <div>
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Full name *</label>
                <input className={inputCls} value={form.customerName} onChange={(e) => set({ customerName: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0555 00 00 00" />
                </div>
                <div>
                  <label className={labelCls}>Email (optional)</label>
                  <input type="email" className={inputCls} value={form.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} placeholder="For order updates" />
                </div>
              </div>
              {!isCustomer && (
                <p className="text-sm text-muted">
                  Have an account? <Link to="/login" className="link-underline text-ink">Sign in</Link> for faster checkout.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className={labelCls}>Wilaya *</label>
                {loadingAreas ? (
                  <div className="skeleton h-12 w-full" />
                ) : (
                  <select className={inputCls} value={form.wilaya} onChange={(e) => set({ wilaya: e.target.value, desk: "" })}>
                    <option value="">Select your wilaya</option>
                    {areas.map((a) => (
                      <option key={a.wilaya} value={a.wilaya}>{a.wilaya}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className={labelCls}>Delivery method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "desk", label: "Pickup point", note: selectedArea ? formatPrice(selectedArea.priceDesk) : "—" },
                    { value: "home", label: "Home delivery", note: selectedArea ? formatPrice(selectedArea.priceHome) : "—" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set({ deliveryType: opt.value, desk: "" })}
                      className={`border p-4 text-left transition ${
                        form.deliveryType === opt.value ? "border-ink bg-paper" : "border-line hover:border-ink"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{opt.label}</span>
                      <span className="mt-1 block text-xs text-muted">{opt.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.deliveryType === "desk" ? (
                <div>
                  <label className={labelCls}>Pickup point *</label>
                  <select
                    className={inputCls}
                    value={form.desk}
                    onChange={(e) => set({ desk: e.target.value })}
                    disabled={!selectedArea}
                  >
                    <option value="">{selectedArea ? "Choose a pickup point" : "Select a wilaya first"}</option>
                    {desks.map((d, i) => (
                      <option key={i} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Full address *</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="Street, building, floor…"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <ReviewRow label="Contact" onEdit={() => setStep(0)}>
                {form.customerName} · {form.phone}
                {form.customerEmail && ` · ${form.customerEmail}`}
              </ReviewRow>
              <ReviewRow label="Delivery" onEdit={() => setStep(1)}>
                {form.deliveryType === "home" ? "Home delivery" : "Pickup point"} — {form.wilaya}
                <br />
                <span className="text-muted">{form.deliveryType === "home" ? form.address : form.desk}</span>
              </ReviewRow>

              <div>
                <h3 className="eyebrow mb-3">Items</h3>
                <div className="divide-y divide-line border-y border-line">
                  {items.map((i) => (
                    <div key={`${i.productId}-${i.variantId}`} className="flex gap-4 py-4">
                      <div className="h-20 w-16 shrink-0 bg-paper">
                        {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <p className="font-display text-base">{i.name}</p>
                          <p className="text-xs text-muted">
                            {[i.color, i.size].filter(Boolean).join(" · ")} · Qty {i.quantity}
                          </p>
                        </div>
                        <span className="text-sm">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted">
                By placing this order you agree to pay <strong className="text-ink">{formatPrice(total)}</strong> in
                cash on delivery.
              </p>
            </div>
          )}

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-ink">
                Back
              </button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid">
                Continue
              </button>
            ) : (
              <button
                onClick={placeOrder}
                disabled={placing}
                className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid disabled:opacity-50"
              >
                {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-line p-7">
            <h2 className="font-display text-2xl">Summary</h2>

            {/* Coupon */}
            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  value={coupon.code}
                  onChange={(e) => setCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                  placeholder="Coupon code"
                  className="flex-1 border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-ink"
                />
                <button
                  onClick={applyCoupon}
                  disabled={coupon.checking}
                  className="border border-ink px-4 text-xs font-semibold uppercase tracking-[0.12em] btn-line disabled:opacity-50"
                >
                  {coupon.checking ? "…" : "Apply"}
                </button>
              </div>
              {coupon.error && <p className="mt-2 text-xs text-clay">{coupon.error}</p>}
              {coupon.applied && (
                <p className="mt-2 text-xs text-ink">
                  {coupon.applied.code} applied
                  {coupon.applied.freeShipping ? " — free shipping" : ` — ${formatPrice(coupon.applied.discount)} off`}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-clay">
                  <span>Discount</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span>{shipping === null ? "—" : shippingAfter === 0 ? "Free" : formatPrice(shippingAfter)}</span>
              </div>
            </div>
            <div className="mt-6 flex items-baseline justify-between border-t border-line pt-6">
              <span className="text-sm uppercase tracking-[0.14em]">Total</span>
              <span className="font-display text-2xl">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewRow({ label, children, onEdit }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <h3 className="eyebrow mb-1.5">{label}</h3>
        <p className="text-sm">{children}</p>
      </div>
      <button onClick={onEdit} className="text-xs uppercase tracking-[0.12em] text-muted hover:text-ink">
        Edit
      </button>
    </div>
  );
}
