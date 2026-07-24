import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Shirt, Layers, Tag, Ticket,
  Users, Truck, Mail, UserCog, Menu, X, ArrowUpRight,
} from "lucide-react";
import { store } from "../../store.config.js";
import { useAuth } from "../../context/AuthContext";

// Denser editorial admin shell: fixed light sidebar, hairline dividers, same
// bone/ink/clay language as the storefront. Nav adapts to admin vs superadmin.
const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Shirt },
  { to: "/admin/collections", label: "Collections", icon: Layers, super: true },
  { to: "/admin/categories", label: "Categories", icon: Tag, super: true },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, super: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/delivery-areas", label: "Delivery", icon: Truck, super: true },
  { to: "/admin/contacts", label: "Messages", icon: Mail },
  { to: "/admin/users", label: "Staff", icon: UserCog, super: true },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { usertype, logout } = useAuth();
  const navigate = useNavigate();
  const isSuper = usertype === "superadmin";
  const items = NAV.filter((n) => !n.super || isSuper);

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
      isActive ? "bg-ink text-bone" : "text-muted hover:bg-paper hover:text-ink"
    }`;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-5">
        <NavLink to="/admin/dashboard" className="font-display text-2xl tracking-[0.1em]">
          {store.brand.name}
        </NavLink>
        <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={20} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} className={linkCls} onClick={() => setOpen(false)}>
            <n.icon size={16} strokeWidth={1.6} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <NavLink to="/" className="mb-2 flex items-center gap-2 px-4 py-2 text-xs text-muted hover:text-ink">
          <ArrowUpRight size={14} /> View store
        </NavLink>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-clay"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bone">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-bone lg:block">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-bone [animation:drawerIn_.3s_var(--ease)]">{Sidebar}</aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 lg:ml-60">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="font-display text-xl tracking-[0.08em]">{store.brand.name}</span>
        </div>
        <div className="p-5 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
