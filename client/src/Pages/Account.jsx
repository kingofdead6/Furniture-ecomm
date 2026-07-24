import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatPrice, formatDate } from "../lib/format";
import { LineSkeleton, EmptyState } from "../Components/Shared/States";

const TABS = ["Orders", "Profile", "Addresses"];

const STATUS_LABEL = {
  pending: "Pending", confirmed: "Confirmed", in_delivery: "Out for delivery",
  reached: "Delivered", canceled: "Canceled",
};

export default function Account() {
  const navigate = useNavigate();
  const { isCustomer, isAuthenticated, profile, refresh, logout, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("Orders");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true, state: { from: "/account" } });
  }, [authLoading, isAuthenticated, navigate]);

  if (!isCustomer) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="display mt-2 text-[clamp(2.2rem,6vw,4rem)]">
            Hello{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-clay">
          Sign out
        </button>
      </div>

      <div className="mt-8 flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-xs font-semibold uppercase tracking-[0.14em] ${
              tab === t ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "Orders" && <Orders />}
        {tab === "Profile" && <Profile profile={profile} refresh={refresh} />}
        {tab === "Addresses" && <Addresses profile={profile} refresh={refresh} />}
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine").then(({ data }) => setOrders(data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LineSkeleton rows={3} />;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" message="When you place an order it will appear here." action={{ to: "/products", label: "Start shopping" }} />;
  }

  return (
    <div className="divide-y divide-line border-y border-line">
      {orders.map((o) => (
        <div key={o._id} className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl">{o.orderNumber}</p>
              <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.length} {o.items.length === 1 ? "item" : "items"}</p>
            </div>
            <div className="text-right">
              <span className="border border-line px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                {STATUS_LABEL[o.status] || o.status}
              </span>
              <p className="mt-2 font-display text-lg">{formatPrice(o.totalPrice)}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {o.items.map((i, idx) => (
              <div key={idx} className="h-16 w-12 bg-paper" title={i.name}>
                {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Profile({ profile, refresh }) {
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, name: profile.name || "", phone: profile.phone || "" }));
  }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me", { name: form.name, phone: form.phone, ...(form.password ? { password: form.password } : {}) });
      await refresh();
      setForm((f) => ({ ...f, password: "" }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3.5 text-sm outline-none focus:border-ink";
  const labelCls = "eyebrow mb-2 block";

  return (
    <form onSubmit={save} className="max-w-md space-y-5">
      <div>
        <label className={labelCls}>Name</label>
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input className={`${inputCls} opacity-60`} value={profile?.email || ""} disabled />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>New password</label>
        <input type="password" placeholder="Leave blank to keep current" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <button type="submit" disabled={saving} className="bg-ink px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-bone btn-solid disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Addresses({ profile, refresh }) {
  const empty = { label: "Home", fullName: "", phone: "", wilaya: "", deliveryType: "home", address: "", desk: "", isDefault: false };
  const [form, setForm] = useState(empty);
  const [adding, setAdding] = useState(false);
  const addresses = profile?.addresses || [];

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/me/addresses", form);
      await refresh();
      setForm(empty);
      setAdding(false);
      toast.success("Address added");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/auth/me/addresses/${id}`);
      await refresh();
      toast.success("Address removed");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";

  return (
    <div>
      {addresses.length === 0 && !adding && (
        <p className="text-muted">You haven't saved any addresses yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a._id} className="border border-line p-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">{a.label}{a.isDefault && " · Default"}</span>
              <button onClick={() => remove(a._id)} className="text-xs text-muted hover:text-clay">Remove</button>
            </div>
            <p className="mt-3 text-sm">{a.fullName}</p>
            <p className="text-sm text-muted">{a.phone}</p>
            <p className="mt-1 text-sm text-muted">
              {a.deliveryType === "home" ? a.address : a.desk} — {a.wilaya}
            </p>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={add} className="mt-6 max-w-lg space-y-4 border border-line p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Label (e.g. Home)" className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input placeholder="Full name" className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Wilaya" className={inputCls} value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} />
          </div>
          <input placeholder="Address / pickup point" className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-[var(--ink)]" />
            Set as default
          </label>
          <div className="flex gap-3">
            <button type="submit" className="bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-bone btn-solid">Save address</button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs uppercase tracking-[0.14em] text-muted hover:text-ink">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-6 border border-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] btn-line">
          Add address
        </button>
      )}
    </div>
  );
}
