import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import { PageHeader, Table, Row, Cell, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

export default function AdminDeliveryAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/delivery-areas").then(({ data }) => setAreas(data.areas || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (a) => {
    try {
      await api.delete(`/delivery-areas/${a.id}`);
      setAreas((prev) => prev.filter((x) => x.id !== a.id));
      toast.success("Delivery area removed");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Delivery areas" count={loading ? "" : areas.length}
        action={<Button onClick={() => setEditing({ isNew: true })}><Plus size={15} /> New wilaya</Button>} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={6} cols={4} />
        : areas.length === 0 ? <AdminEmpty title="No delivery areas" message="Add a wilaya with its home and desk prices." action={<Button onClick={() => setEditing({ isNew: true })}>Add wilaya</Button>} />
        : (
          <Table head={["Wilaya", "Home", "Desk", "Pickup points", ""]}>
            {areas.map((a) => (
              <Row key={a.id}>
                <Cell className="font-display text-base">{a.wilaya}</Cell>
                <Cell>{formatPrice(a.priceHome)}</Cell>
                <Cell>{formatPrice(a.priceDesk)}</Cell>
                <Cell className="text-muted">{a.desks?.map((d) => d.name).join(", ") || "—"}</Cell>
                <Cell>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(a)} className="text-xs font-semibold uppercase tracking-[0.1em] hover:text-clay">Edit</button>
                    <button onClick={() => setConfirmDel(a)} className="text-muted hover:text-clay" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </Cell>
              </Row>
            ))}
          </Table>
        )}

      {editing && <AreaForm area={editing.isNew ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Remove wilaya?">
        <p className="text-muted">Remove “{confirmDel?.wilaya}” from delivery areas?</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}

function AreaForm({ area, onClose, onSaved }) {
  const [form, setForm] = useState({
    wilaya: area?.wilaya || "", priceHome: area?.priceHome ?? 500, priceDesk: area?.priceDesk ?? 350,
  });
  const [desks, setDesks] = useState(area?.desks?.map((d) => d.name) || [""]);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!area && !form.wilaya.trim()) return toast.error("Wilaya name is required");
    setSaving(true);
    const payload = {
      priceHome: Number(form.priceHome), priceDesk: Number(form.priceDesk),
      desks: desks.filter((d) => d.trim()).map((name) => ({ name: name.trim() })),
    };
    try {
      if (area) await api.put(`/delivery-areas/${area.id}`, payload);
      else await api.post("/delivery-areas", { wilaya: form.wilaya, ...payload });
      toast.success(area ? "Area updated" : "Area added");
      onSaved();
      onClose();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={area ? `Edit ${area.wilaya}` : "New wilaya"}>
      <form onSubmit={submit} className="space-y-5">
        {!area && <Field label="Wilaya"><input className={inputCls} value={form.wilaya} onChange={(e) => set({ wilaya: e.target.value })} /></Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home delivery (DA)"><input type="number" className={inputCls} value={form.priceHome} onChange={(e) => set({ priceHome: e.target.value })} /></Field>
          <Field label="Desk delivery (DA)"><input type="number" className={inputCls} value={form.priceDesk} onChange={(e) => set({ priceDesk: e.target.value })} /></Field>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Pickup points</span>
            <button type="button" onClick={() => setDesks((d) => [...d, ""])} className="text-xs font-semibold uppercase tracking-[0.12em] hover:text-clay">+ Add</button>
          </div>
          <div className="space-y-2">
            {desks.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={inputCls} value={d} placeholder="Pickup point name" onChange={(e) => setDesks((prev) => prev.map((x, idx) => idx === i ? e.target.value : x))} />
                <button type="button" onClick={() => setDesks((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted hover:text-clay" aria-label="Remove"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
