import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { PageHeader, Table, Row, Cell, StatusBadge, Modal, Button, TableSkeleton, AdminError, AdminEmpty, Field, inputCls } from "./ui";

const ROLES = ["admin", "superadmin"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/auth/users").then(({ data }) => setUsers(data || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Only show staff accounts here (customers live under Customers).
  const staff = users.filter((u) => u.usertype === "admin" || u.usertype === "superadmin");

  const remove = async (u) => {
    try {
      await api.delete(`/auth/users/${u._id}`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      toast.success("User removed");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Access" title="Staff" count={loading ? "" : staff.length}
        action={<Button onClick={() => setCreating(true)}><Plus size={15} /> New staff</Button>} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={4} cols={4} />
        : staff.length === 0 ? <AdminEmpty title="No staff accounts" action={<Button onClick={() => setCreating(true)}>Add staff</Button>} />
        : (
          <Table head={["Name", "Email", "Role", ""]}>
            {staff.map((u) => (
              <Row key={u._id}>
                <Cell className="font-display text-base">{u.name || "—"}</Cell>
                <Cell className="text-muted">{u.email}</Cell>
                <Cell><StatusBadge status={u.usertype === "superadmin" ? "reached" : "confirmed"} label={u.usertype} /></Cell>
                <Cell>
                  {u.usertype !== "superadmin" && (
                    <button onClick={() => setConfirmDel(u)} className="text-muted hover:text-clay" aria-label="Delete"><Trash2 size={15} /></button>
                  )}
                </Cell>
              </Row>
            ))}
          </Table>
        )}

      {creating && <StaffForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Remove user?">
        <p className="text-muted">Remove “{confirmDel?.name || confirmDel?.email}”? They'll lose admin access.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}

function StaffForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", usertype: "admin" });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) return toast.error("Name, email and a 6+ char password are required");
    setSaving(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Staff account created");
      onSaved();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="New staff account">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" className={inputCls} value={form.password} onChange={(e) => set({ password: e.target.value })} /></Field>
        <Field label="Role">
          <select className={inputCls} value={form.usertype} onChange={(e) => set({ usertype: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}
