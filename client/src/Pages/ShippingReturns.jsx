import { Link } from "react-router-dom";
import { store } from "../store.config.js";

const SECTIONS = [
  {
    title: "Delivery",
    body: [
      "We deliver across all 58 wilayas of Algeria. Your delivery cost is calculated at checkout based on your wilaya and whether you choose home delivery or collection from a pickup point.",
      "Orders are dispatched within 1–2 business days. A member of our team will call to confirm your order before it ships.",
    ],
  },
  {
    title: "Cash on delivery",
    body: [
      "Payment is made in cash when your order is delivered or collected. Please have the exact total ready — it's shown on your order confirmation.",
      "Nothing is charged online; we never ask for card details.",
    ],
  },
  {
    title: "Returns",
    body: [
      "If something isn't right, you can return unworn pieces with their original tags within 14 days of delivery.",
      "To start a return, contact us with your order number and we'll arrange collection or a drop-off point. Refunds are issued once we've received and inspected the piece.",
    ],
  },
  {
    title: "Exchanges",
    body: [
      "Need a different size or colour? Reach out within 14 days and, subject to availability, we'll exchange it for you. Delivery for the replacement follows the standard COD process.",
    ],
  },
];

export default function ShippingReturns() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Client care</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,6vw,4.5rem)]">Shipping &amp; Returns</h1>
      </div>

      <div className="mt-12 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.title} className="grid gap-4 md:grid-cols-[200px_1fr]">
            <h2 className="font-display text-2xl">{s.title}</h2>
            <div className="space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-muted">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 border-t border-line pt-8 text-sm text-muted">
        <p>
          Questions? Email{" "}
          <a href={`mailto:${store.contact.email}`} className="link-underline text-ink">{store.contact.email}</a>{" "}
          or visit our <Link to="/contact" className="link-underline text-ink">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
