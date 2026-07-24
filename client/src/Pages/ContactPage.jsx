import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Phone, MapPin } from "lucide-react";
import { api, apiError } from "../lib/api";
import { store } from "../store.config.js";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      return toast.error("Please fill in all required fields");
    }
    setSending(true);
    try {
      await api.post("/contact", form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("Message sent — we'll be in touch");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3.5 text-sm outline-none transition-colors focus:border-ink";
  const labelCls = "eyebrow mb-2 block";

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">We're here to help</p>
        <h1 className="display mt-2 text-[clamp(2.5rem,8vw,6rem)]">Contact</h1>
      </div>

      <div className="grid gap-16 pt-12 lg:grid-cols-[1fr_1.2fr]">
        {/* Details */}
        <div>
          <p className="max-w-sm text-muted">
            Questions about an order, sizing, or a return? Send us a note and we'll reply within one
            business day.
          </p>
          <div className="mt-10 space-y-6">
            <a href={`mailto:${store.contact.email}`} className="flex items-start gap-4 hover:text-clay">
              <Mail size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="eyebrow block">Email</span>
                <span className="mt-1 block">{store.contact.email}</span>
              </span>
            </a>
            <a href={`tel:${store.contact.phoneHref}`} className="flex items-start gap-4 hover:text-clay">
              <Phone size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="eyebrow block">Phone</span>
                <span className="mt-1 block">{store.contact.phone}</span>
              </span>
            </a>
            <div className="flex items-start gap-4">
              <MapPin size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="eyebrow block">Studio</span>
                <span className="mt-1 block">{store.contact.address}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        {sent ? (
          <div className="flex flex-col items-start justify-center border border-line p-12">
            <p className="eyebrow text-clay">Message received</p>
            <h2 className="display mt-3 text-3xl">Thank you.</h2>
            <p className="mt-3 text-muted">We've got your message and will reply shortly.</p>
            <button onClick={() => setSent(false)} className="mt-8 border border-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] btn-line">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name *</label>
                <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Subject *</label>
                <input className={inputCls} value={form.subject} onChange={(e) => set({ subject: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Message *</label>
              <textarea className={`${inputCls} resize-none`} rows={6} value={form.message} onChange={(e) => set({ message: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
