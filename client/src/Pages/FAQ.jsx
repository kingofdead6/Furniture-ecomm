import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus } from "lucide-react";

const GROUPS = [
  {
    title: "Orders & Payment",
    items: [
      { q: "How do I pay?", a: "All orders are cash on delivery (COD). You pay in cash when your order arrives — nothing is charged online." },
      { q: "Can I order without an account?", a: "Yes. Guest checkout is available. Creating an account simply lets you track orders and save a wishlist and addresses." },
      { q: "Do you offer discount codes?", a: "From time to time. Enter a valid code at checkout and the discount is applied to your subtotal before delivery." },
    ],
  },
  {
    title: "Delivery & Assembly",
    items: [
      { q: "Where do you deliver?", a: "Across Algeria. Delivery cost depends on your wilaya and whether you choose home delivery or a pickup point — it's shown at checkout." },
      { q: "How long does delivery take?", a: "Small items ship in 2–5 business days. Larger pieces such as sofas and beds are made to order and typically arrive within 2–4 weeks. We'll call to confirm before dispatch." },
      { q: "Do you assemble the furniture?", a: "Most pieces arrive flat-packed with clear instructions and the tools you need. For large items in Alger, Oran and Constantine we can arrange assembly on request — just ask when we call to confirm." },
    ],
  },
  {
    title: "Returns & Dimensions",
    items: [
      { q: "What is your return policy?", a: "Unused pieces in their original packaging can be returned within 14 days. Made-to-order upholstery is final sale — see Shipping & Returns for the full details." },
      { q: "How do I know it will fit?", a: "Every product page lists full dimensions in centimetres, and the Dimensions guide has tips for measuring your space, doorways and stairwells before you order." },
    ],
  },
];

export default function FAQ() {
  const [open, setOpen] = useState("0-0");

  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Help</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,7vw,5rem)]">Frequently asked</h1>
      </div>

      <div className="mt-12 space-y-14">
        {GROUPS.map((group, gi) => (
          <section key={group.title}>
            <h2 className="eyebrow text-clay">{group.title}</h2>
            <div className="mt-4 border-t border-line">
              {group.items.map((item, ii) => {
                const key = `${gi}-${ii}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border-b border-line">
                    <button
                      onClick={() => setOpen(isOpen ? "" : key)}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-xl">{item.q}</span>
                      {isOpen ? <Minus size={18} className="shrink-0" /> : <Plus size={18} className="shrink-0" />}
                    </button>
                    {isOpen && <p className="pb-6 text-muted">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 border border-line p-8 text-center">
        <p className="font-display text-2xl">Still have a question?</p>
        <p className="mt-2 text-muted">Our team is happy to help.</p>
        <Link to="/contact" className="mt-6 inline-block bg-ink px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid">
          Contact us
        </Link>
      </div>
    </div>
  );
}
