import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { PageHeader, Table, Row, Cell, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/categories").then(({ data }) => setItems(data || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (c) => {
    try {
      await api.delete(`/categories/${c._id}`);
      setItems((prev) => prev.filter((x) => x._id !== c._id));
      toast.success("Category deleted");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Categories" count={loading ? "" : items.length}
        action={<Button onClick={() => setEditing({})}><Plus size={15} /> New category</Button>} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={5} cols={3} />
        : items.length === 0 ? <AdminEmpty title="No categories" action={<Button onClick={() => setEditing({})}>Add category</Button>} />
        : (
          <Table head={["", "Name", "Description", ""]}>
            {items.map((c) => (
              <Row key={c._id}>
                <Cell><div className="h-12 w-12 bg-paper">{c.image?.url && <img src={c.image.url} alt="" className="h-full w-full object-cover" />}</div></Cell>
                <Cell className="font-display text-base">{c.name}</Cell>
                <Cell className="text-muted">{c.description || "—"}</Cell>
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

      {editing && <CategoryForm category={editing._id ? editing : null} onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => { setItems((prev) => isNew ? [...prev, saved] : prev.map((x) => x._id === saved._id ? saved : x)); setEditing(null); }} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete category?">
        <p className="text-muted">Delete “{confirmDel?.name}”? Products in it won't be removed but will lose this category.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", description);
    if (file) fd.append("image", file);
    try {
      const res = category ? await api.put(`/categories/${category._id}`, fd) : await api.post("/categories", fd);
      toast.success(category ? "Category updated" : "Category created");
      onSaved(res.data, !category);
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={category ? "Edit category" : "New category"}>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Description"><textarea rows={2} className={`${inputCls} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div>
          <span className="eyebrow mb-2 block">Image</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 bg-paper">
              {file ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                : category?.image?.url ? <img src={category.image.url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <label className="cursor-pointer border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] hover:border-ink">
              Choose file
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            {file && <button type="button" onClick={() => setFile(null)} className="text-muted hover:text-clay"><X size={16} /></button>}
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
