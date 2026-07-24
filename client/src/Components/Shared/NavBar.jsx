import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, ShoppingBag, Menu, X } from "lucide-react";
import { store } from "../../store.config.js";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import CartDrawer from "./CartDrawer";

const CUSTOMER_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Collections", to: "/collections" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const ADMIN_LINKS = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Products", to: "/admin/products" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAdmin, isCustomer, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
    setCartOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  const links = isAdmin ? ADMIN_LINKS : CUSTOMER_LINKS;

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setQ("");
  };

  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <>
      {/* Announcement band */}
      <div className="bg-ink text-bone">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-5 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em]">
          Cash on delivery across Algeria · Complimentary returns within 14 days
        </div>
      </div>

      <header className="sticky top-0 z-[90] border-b border-line bg-bone/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 md:px-8">
          {/* Left — desktop nav / mobile burger */}
          <div className="flex items-center">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden -ml-1 p-1"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.6} />
            </button>
            <nav className="hidden items-center gap-7 md:flex">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                    isActive(l.to) ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — wordmark */}
          <Link
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="justify-self-center font-display text-2xl tracking-[0.12em] md:text-[28px]"
          >
            {store.brand.name}
          </Link>

          {/* Right — utilities */}
          <div className="flex items-center justify-end gap-4 md:gap-5">
            {!isAdmin && (
              <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search" className="p-1 hover:text-clay">
                <Search size={19} strokeWidth={1.6} />
              </button>
            )}
            {!isAdmin && (
              <Link to="/wishlist" aria-label="Wishlist" className="relative hidden p-1 hover:text-clay sm:block">
                <Heart size={19} strokeWidth={1.6} />
                {wishCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-clay px-1 text-[9px] font-bold text-bone">
                    {wishCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/account") : "/login"}
              aria-label="Account"
              className="p-1 hover:text-clay"
            >
              <User size={19} strokeWidth={1.6} />
            </Link>
            {isAdmin ? (
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                Sign out
              </button>
            ) : (
              <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative p-1 hover:text-clay">
                <ShoppingBag size={19} strokeWidth={1.6} />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-ink px-1 text-[9px] font-bold text-bone">
                    {count}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanding search */}
        {searchOpen && (
          <div className="border-t border-line bg-bone">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-4 md:px-8">
              <Search size={20} strokeWidth={1.6} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for pieces, categories…"
                className="flex-1 bg-transparent font-display text-xl outline-none placeholder:text-muted/60"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[120] md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 [animation:fadeIn_.25s]" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-bone [animation:drawerIn_.35s_var(--ease)]">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="font-display text-xl tracking-[0.1em]">{store.brand.name}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={22} /></button>
            </div>
            <nav className="flex flex-col px-6 py-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="border-b border-line py-4 font-display text-2xl"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-line px-6 py-6 text-sm">
              {!isAdmin && (
                <>
                  <Link to="/wishlist" className="flex items-center gap-3"><Heart size={18} /> Wishlist</Link>
                  <Link to={isCustomer ? "/account" : "/login"} className="flex items-center gap-3">
                    <User size={18} /> {isCustomer ? "My account" : "Sign in"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
