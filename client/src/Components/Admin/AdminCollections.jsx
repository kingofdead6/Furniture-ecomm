import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { PageHeader, Table, Row, Cell, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

export default function AdminCollections() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.all([api.get("/collections"), api.get("/products", { params: { status: "all", limit: 60 } })])
      .then(([c, p]) => { setItems(c.data || []); setProducts(p.data.products || []); })
      .catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (c) => {
    try {
      await api.delete(`/collections/${c._id}`);
      setItems((prev) => prev.filter((x) => x._id !== c._id));
      toast.success("Collection deleted");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Collections" count={loading ? "" : items.length}
        action={<Button onClick={() => setEditing({})}><Plus size={15} /> New collection</Button>} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={4} cols={4} />
        : items.length === 0 ? <AdminEmpty title="No collections" action={<Button onClick={() => setEditing({})}>Add collection</Button>} />
        : (
          <Table head={["", "Name", "Season", "Products", "Featured", ""]}>
            {items.map((c) => (
              <Row key={c._id}>
                <Cell><div className="h-12 w-16 bg-paper">{c.heroImage?.url && <img src={c.heroImage.url} alt="" className="h-full w-full object-cover" />}</div></Cell>
                <Cell className="font-display text-base">{c.name}</Cell>
                <Cell className="text-muted">{c.season || "—"}</Cell>
                <Cell>{c.products?.length || 0}</Cell>
                <Cell>{c.featured ? <span className="text-clay">Yes</span> : <span className="text-muted">No</span>}</Cell>
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

      {editing && <CollectionForm collection={editing._id ? editing : null} products={products} onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => { setItems((prev) => isNew ? [...prev, saved] : prev.map((x) => x._id === saved._id ? saved : x)); setEditing(null); }} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete collection?">
        <p className="text-muted">Delete “{confirmDel?.name}”? Products remain in the catalog.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CollectionForm({ collection, products, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: collection?.name || "", subtitle: collection?.subtitle || "", season: collection?.season || "",
    description: collection?.description || "", featured: collection?.featured || false,
  });
  const [selected, setSelected] = useState((collection?.products || []).map((p) => (typeof p === "string" ? p : p._id)));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("products", JSON.stringify(selected));
    if (file) fd.append("heroImage", file);
    try {
      const res = collection ? await api.put(`/collections/${collection._id}`, fd) : await api.post("/collections", fd);
      toast.success(collection ? "Collection updated" : "Collection created");
      onSaved(res.data, !collection);
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={collection ? "Edit collection" : "New collection"} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Season (e.g. AW25)"><input className={inputCls} value={form.season} onChange={(e) => set({ season: e.target.value })} /></Field>
        </div>
        <Field label="Subtitle"><input className={inputCls} value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={2} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>

        <div>
          <span className="eyebrow mb-2 block">Hero image</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-28 bg-paper">
              {file ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                : collection?.heroImage?.url ? <img src={collection.heroImage.url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <label className="cursor-pointer border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] hover:border-ink">
              Choose file
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div>
          <span className="eyebrow mb-2 block">Products in this collection ({selected.length})</span>
          <div className="max-h-48 overflow-y-auto border border-line p-2">
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button key={p._id} type="button" onClick={() => toggle(p._id)}
                  className={`border px-3 py-1.5 text-xs ${selected.includes(p._id) ? "border-ink bg-ink text-bone" : "border-line hover:border-ink"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-[var(--ink)]" /> Featured on storefront</label>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
