import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { store } from "../../store.config.js";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All pieces", to: "/products" },
      { label: "Collections", to: "/collections" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
  {
    title: "Client care",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Shipping & Returns", to: "/shipping-returns" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our story", to: "/about" },
      { label: "My account", to: "/account" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const year = new Date().getFullYear();

  const submit = (e) => {
    e.preventDefault();
    if (email.trim()) setDone(true);
  };

  return (
    <footer className="mt-24 border-t border-line bg-bone">
      {/* Newsletter band */}
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-16 md:grid-cols-2 md:items-center md:px-8">
          <div>
            <h2 className="display text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
              Join the studio<br />list.
            </h2>
            <p className="mt-3 max-w-md text-muted">
              First look at new arrivals, collection drops and private sales. No noise.
            </p>
          </div>
          {done ? (
            <p className="text-clay md:justify-self-end" role="status">
              Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={submit} className="flex items-end gap-4 border-b border-ink pb-2 md:max-w-md md:justify-self-end">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted"
              />
              <button type="submit" className="text-xs font-semibold uppercase tracking-[0.18em] hover:text-clay">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div>
          <p className="font-display text-3xl tracking-[0.1em]">{store.brand.name}</p>
          <p className="mt-4 max-w-xs text-sm text-muted">{store.brand.tagline}</p>
          <div className="mt-6 flex gap-4">
            {store.social.instagram && (
              <a href={store.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted hover:text-ink">
                <Instagram size={18} />
              </a>
            )}
            {store.social.facebook && (
              <a href={store.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted hover:text-ink">
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Legal */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {year} {store.brand.fullName}. All rights reserved.</p>
          <p>{store.contact.address}</p>
        </div>
      </div>
    </footer>
  );
}
