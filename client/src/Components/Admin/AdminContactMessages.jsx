import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Mail } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { PageHeader, Modal, Button, TableSkeleton, AdminError, AdminEmpty } from "./ui";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/contact").then(({ data }) => setMessages(data || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (m) => {
    try {
      await api.delete(`/contact/${m._id}`);
      setMessages((prev) => prev.filter((x) => x._id !== m._id));
      if (active?._id === m._id) setActive(null);
      toast.success("Message deleted");
    } catch (e) { toast.error(apiError(e)); } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Messages" count={loading ? "" : messages.length} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={5} cols={3} />
        : messages.length === 0 ? <AdminEmpty title="No messages" message="Enquiries from the contact form appear here." />
        : (
          <div className="divide-y divide-line border border-line">
            {messages.map((m) => (
              <button key={m._id} onClick={() => setActive(m)} className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-paper/50">
                <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center border border-line text-muted"><Mail size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-lg">{m.subject}</span>
                    <span className="shrink-0 text-xs text-muted">{formatDate(m.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{m.name} · {m.email}</span>
                  <span className="mt-1 block truncate text-sm text-muted">{m.message}</span>
                </span>
              </button>
            ))}
          </div>
        )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.subject || "Message"}>
        {active && (
          <div>
            <div className="space-y-1 border-b border-line pb-4 text-sm">
              <p><span className="text-muted">From</span> — {active.name}</p>
              <p><span className="text-muted">Email</span> — <a href={`mailto:${active.email}`} className="link-underline">{active.email}</a></p>
              {active.phone && <p><span className="text-muted">Phone</span> — {active.phone}</p>}
              <p className="text-xs text-muted">{formatDate(active.createdAt)}</p>
            </div>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{active.message}</p>
            <div className="mt-6 flex justify-between border-t border-line pt-5">
              <Button variant="danger" onClick={() => setConfirmDel(active)}><Trash2 size={14} /> Delete</Button>
              <a href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject)}`}>
                <Button variant="solid">Reply by email</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete message?">
        <p className="text-muted">Delete this message from {confirmDel?.name}? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
