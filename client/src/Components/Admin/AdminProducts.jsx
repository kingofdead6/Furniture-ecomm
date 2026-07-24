import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import { PageHeader, Table, Row, Cell, StatusBadge, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

const GENDERS = ["women", "men", "unisex"];
const emptyVariant = () => ({ size: "", color: "", colorHex: "#1B1712", sku: "", stock: 0 });
// Fixed-width variant inputs (deliberately NOT using inputCls, whose w-full
// would override the per-field widths and stack the row).
const vInput = "border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-ink";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.get("/products", { params: { status: "all", limit: 60 } }),
      api.get("/categories"),
      api.get("/collections"),
    ])
      .then(([p, c, col]) => {
        setProducts(p.data.products || []);
        setCategories(c.data || []);
        setCollections(col.data || []);
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (product) => {
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setConfirmDel(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Products"
        count={loading ? "" : products.length}
        action={<Button onClick={() => setEditing({})}><Plus size={15} /> New product</Button>}
      />

      {error ? (
        <AdminError message={error} onRetry={load} />
      ) : loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : products.length === 0 ? (
        <AdminEmpty title="No products yet" message="Add your first piece to the catalog." action={<Button onClick={() => setEditing({})}>Add product</Button>} />
      ) : (
        <Table head={["", "Name", "Category", "Price", "Stock", "Status", ""]}>
          {products.map((p) => (
            <Row key={p._id}>
              <Cell><div className="h-12 w-9 bg-paper">{p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}</div></Cell>
              <Cell className="font-display text-base">{p.name}{p.featured && <span className="ml-2 text-[10px] uppercase tracking-wide text-clay">Featured</span>}</Cell>
              <Cell className="text-muted">{p.category?.name || "—"}</Cell>
              <Cell>{formatPrice(p.price)}</Cell>
              <Cell className={p.stock <= 5 ? "text-clay" : ""}>{p.stock}</Cell>
              <Cell><StatusBadge status={p.status === "active" ? "confirmed" : "pending"} label={p.status} /></Cell>
              <Cell>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(p)} className="text-xs font-semibold uppercase tracking-[0.1em] hover:text-clay">Edit</button>
                  <button onClick={() => setConfirmDel(p)} className="text-muted hover:text-clay" aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {editing && (
        <ProductForm
          product={editing._id ? editing : null}
          categories={categories}
          collections={collections}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setProducts((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p._id === saved._id ? saved : p))));
            setEditing(null);
          }}
        />
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete product?">
        <p className="text-muted">This permanently removes “{confirmDel?.name}” and its images. This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function ProductForm({ product, categories, collections, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: product?.name || "",
    category: product?.category?._id || product?.category || "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    gender: product?.gender || "unisex",
    stock: product?.stock ?? 0,
    description: product?.description || "",
    details: product?.details || "",
    material: product?.material || "",
    care: product?.care || "",
    featured: product?.featured || false,
    status: product?.status || "active",
  }));
  const [variants, setVariants] = useState(product?.variants?.length ? product.variants.map((v) => ({ ...v })) : []);
  const [selectedCollections, setSelectedCollections] = useState(
    (product?.collections || []).map((c) => (typeof c === "string" ? c : c._id))
  );
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [removeImages, setRemoveImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setVariant = (i, patch) => setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeVariant = (i) => setVariants((vs) => vs.filter((_, idx) => idx !== i));
  const toggleCollection = (id) =>
    setSelectedCollections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const dropExisting = (img) => {
    setExistingImages((prev) => prev.filter((x) => x !== img));
    setRemoveImages((prev) => [...prev, img.public_id || img.url]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price === "") {
      return toast.error("Name, category and price are required");
    }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("variants", JSON.stringify(variants));
    fd.append("collections", JSON.stringify(selectedCollections));
    if (removeImages.length) fd.append("removeImages", JSON.stringify(removeImages));
    newFiles.forEach((f) => fd.append("images", f));

    try {
      const res = product
        ? await api.put(`/products/${product._id}`, fd)
        : await api.post("/products", fd);
      toast.success(product ? "Product updated" : "Product created");
      onSaved(res.data, !product);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={product ? "Edit product" : "New product"} wide>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Price (DA)"><input type="number" className={inputCls} value={form.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          <Field label="Compare-at price (optional)"><input type="number" className={inputCls} value={form.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Base stock (used only if no variants)"><input type="number" className={inputCls} value={form.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>
        </div>

        <Field label="Short description"><textarea rows={2} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Material"><input className={inputCls} value={form.material} onChange={(e) => set({ material: e.target.value })} /></Field>
          <Field label="Care"><input className={inputCls} value={form.care} onChange={(e) => set({ care: e.target.value })} /></Field>
        </div>

        {/* Variants */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Variants (size / colour / stock)</span>
            <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant()])} className="text-xs font-semibold uppercase tracking-[0.12em] hover:text-clay">+ Add variant</button>
          </div>
          {variants.length === 0 && <p className="text-xs text-muted">No variants — the base stock above is used.</p>}
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input placeholder="Size" className={`${vInput} w-16`} value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} />
                <input placeholder="Colour" className={`${vInput} w-28`} value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} />
                <input type="color" className="h-10 w-10 shrink-0 border border-line" value={v.colorHex} onChange={(e) => setVariant(i, { colorHex: e.target.value })} />
                <input placeholder="SKU" className={`${vInput} w-28`} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} />
                <input type="number" placeholder="Stock" className={`${vInput} w-20`} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} />
                <button type="button" onClick={() => removeVariant(i)} className="text-muted hover:text-clay" aria-label="Remove variant"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        {collections.length > 0 && (
          <div>
            <span className="eyebrow mb-2 block">Collections</span>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggleCollection(c._id)}
                  className={`border px-3 py-1.5 text-xs ${selectedCollections.includes(c._id) ? "border-ink bg-ink text-bone" : "border-line hover:border-ink"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <span className="eyebrow mb-2 block">Images</span>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img, i) => (
              <div key={i} className="relative h-24 w-20 bg-paper">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => dropExisting(img)} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center bg-ink text-bone" aria-label="Remove image"><X size={12} /></button>
              </div>
            ))}
            {newFiles.map((f, i) => (
              <div key={`n${i}`} className="relative h-24 w-20 bg-paper">
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center bg-ink text-bone" aria-label="Remove"><X size={12} /></button>
              </div>
            ))}
            <label className="grid h-24 w-20 cursor-pointer place-items-center border border-dashed border-line text-muted hover:border-ink hover:text-ink">
              <Plus size={20} />
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setNewFiles((prev) => [...prev, ...Array.from(e.target.files)])} />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-[var(--ink)]" /> Featured</label>
          <label className="flex items-center gap-2 text-sm">
            <span>Status</span>
            <select className="border border-line bg-transparent px-2 py-1 text-sm" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : product ? "Save changes" : "Create product"}</Button>
        </div>
      </form>
    </Modal>
  );
}
