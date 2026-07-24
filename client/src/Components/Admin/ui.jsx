import { useEffect } from "react";
import { X } from "lucide-react";

// ── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, count, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-1 text-[clamp(1.8rem,4vw,2.8rem)]">
          {title}
          {count !== undefined && <span className="ml-3 align-middle text-base text-muted">{count}</span>}
        </h1>
      </div>
      {action}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────
export function Button({ variant = "solid", className = "", ...rest }) {
  const base = "inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
  const styles = {
    solid: "bg-ink text-bone btn-solid",
    outline: "border border-ink btn-line",
    ghost: "text-muted hover:text-ink",
    danger: "border border-clay text-clay hover:bg-clay hover:text-bone",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub }) {
  return (
    <div className="border border-line p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-4xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

// ── Table primitives ─────────────────────────────────────────────────────────
export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-paper/50 text-left">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Row({ children }) {
  return <tr className="border-b border-line last:border-0 hover:bg-paper/40">{children}</tr>;
}
export function Cell({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_TONE = {
  pending: "border-muted text-muted",
  confirmed: "border-ink text-ink",
  in_delivery: "border-ink text-ink",
  reached: "border-ink bg-ink text-bone",
  canceled: "border-clay text-clay",
  new: "border-clay text-clay",
  read: "border-muted text-muted",
};
export function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_TONE[status] || "border-line text-muted"}`}>
      {label || status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative my-4 w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-bone p-7 shadow-2xl [animation:sheetUp_.35s_var(--ease)]`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Form fields ──────────────────────────────────────────────────────────────
export const inputCls = "w-full border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink";
export const labelCls = "eyebrow mb-1.5 block";

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

// ── Async states ─────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div className="border border-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-line px-4 py-4 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminEmpty({ title, message, action }) {
  return (
    <div className="border border-dashed border-line py-20 text-center">
      <p className="font-display text-2xl">{title}</p>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function AdminError({ message = "Couldn't load this.", onRetry }) {
  return (
    <div className="border border-line py-20 text-center">
      <p className="eyebrow text-clay">Error</p>
      <p className="mt-2 text-muted">{message}</p>
      {onRetry && <Button variant="outline" className="mt-6" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
