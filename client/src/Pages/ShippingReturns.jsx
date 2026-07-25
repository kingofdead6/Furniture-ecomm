import { Link } from "react-router-dom";
import { store } from "../store.config.js";

const SECTIONS = [
  {
    title: "Delivery",
    body: [
      "We deliver across all 58 wilayas of Algeria. Your delivery cost is calculated at checkout based on your wilaya and whether you choose home delivery or collection from a pickup point.",
      "In-stock accessories and smaller items are dispatched within 1–2 business days. Larger pieces — sofas, beds and dining tables — are made to order and typically arrive within 2–4 weeks. A member of our team will call to confirm your order and a delivery window before it ships.",
    ],
  },
  {
    title: "Assembly",
    body: [
      "Most pieces arrive flat-packed with clear instructions and the tools you need. Larger items are shipped part-assembled to keep them safe in transit.",
      "In Alger, Oran and Constantine we can arrange in-home assembly on request — mention it when we call to confirm your order.",
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
    title: "Returns & exchanges",
    body: [
      "If something isn't right, you can return unused pieces in their original packaging within 14 days of delivery. Made-to-order upholstery is final sale.",
      "To start a return or exchange, contact us with your order number and we'll arrange collection. Refunds are issued once we've received and inspected the piece.",
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
