import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { formatPrice, formatDate } from "../../lib/format";
import { PageHeader, Table, Row, Cell, StatusBadge, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

const TYPES = [
  { value: "percent", label: "Percent off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "free_shipping", label: "Free shipping" },
];

function describe(c) {
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "fixed") return `${formatPrice(c.value)} off`;
  return "Free shipping";
}

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/coupons").then(({ data }) => setItems(data || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (c) => {
    try {
      await api.delete(`/coupons/${c._id}`);
      setItems((prev) => prev.filter((x) => x._id !== c._id));
      toast.success("Coupon deleted");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Coupons" count={loading ? "" : items.length}
        action={<Button onClick={() => setEditing({})}><Plus size={15} /> New coupon</Button>} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={4} cols={5} />
        : items.length === 0 ? <AdminEmpty title="No coupons" message="Create a discount code for the storefront." action={<Button onClick={() => setEditing({})}>Add coupon</Button>} />
        : (
          <Table head={["Code", "Discount", "Min. spend", "Used", "Expires", "Active", ""]}>
            {items.map((c) => (
              <Row key={c._id}>
                <Cell className="font-display text-base tracking-wide">{c.code}</Cell>
                <Cell>{describe(c)}</Cell>
                <Cell className="text-muted">{c.minSubtotal ? formatPrice(c.minSubtotal) : "—"}</Cell>
                <Cell>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Cell>
                <Cell className="text-muted">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</Cell>
                <Cell><StatusBadge status={c.active ? "confirmed" : "canceled"} label={c.active ? "Active" : "Off"} /></Cell>
                <Cell>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(c)} className="text-xs font-semibold uppercase tracking-[0.1em] hover:text-clay">Edit</button>
                    <button onClick={() => setConfirmDel(c)} className="text-muted hover:text-clay" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>
        )}

      {editing && <CouponForm coupon={editing._id ? editing : null} onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => { setItems((prev) => isNew ? [saved, ...prev] : prev.map((x) => x._id === saved._id ? saved : x)); setEditing(null); }} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete coupon?">
        <p className="text-muted">Delete code “{confirmDel?.code}”? Customers won't be able to use it anymore.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: coupon?.code || "", type: coupon?.type || "percent", value: coupon?.value ?? "",
    minSubtotal: coupon?.minSubtotal ?? "", usageLimit: coupon?.usageLimit ?? "",
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : "", active: coupon?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Code is required");
    setSaving(true);
    const payload = {
      code: form.code, type: form.type, value: Number(form.value) || 0,
      minSubtotal: Number(form.minSubtotal) || 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiresAt: form.expiresAt || null, active: form.active,
    };
    try {
      const res = coupon ? await api.put(`/coupons/${coupon._id}`, payload) : await api.post("/coupons", payload);
      toast.success(coupon ? "Coupon updated" : "Coupon created");
      onSaved(res.data, !coupon);
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={coupon ? "Edit coupon" : "New coupon"}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code"><input className={`${inputCls} uppercase`} value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => set({ type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          {form.type !== "free_shipping" && (
            <Field label={form.type === "percent" ? "Percent (0–100)" : "Amount (DA)"}>
              <input type="number" className={inputCls} value={form.value} onChange={(e) => set({ value: e.target.value })} />
            </Field>
          )}
          <Field label="Minimum spend (DA)"><input type="number" className={inputCls} value={form.minSubtotal} onChange={(e) => set({ minSubtotal: e.target.value })} /></Field>
          <Field label="Usage limit (blank = unlimited)"><input type="number" className={inputCls} value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} /></Field>
          <Field label="Expires"><input type="date" className={inputCls} value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="accent-[var(--ink)]" /> Active</label>
        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
