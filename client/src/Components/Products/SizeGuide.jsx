import { useEffect } from "react";
import { X } from "lucide-react";

const ROWS = [
  { size: "XS", chest: "84–88", waist: "66–70", hip: "90–94" },
  { size: "S", chest: "89–93", waist: "71–75", hip: "95–99" },
  { size: "M", chest: "94–98", waist: "76–80", hip: "100–104" },
  { size: "L", chest: "99–104", waist: "81–86", hip: "105–110" },
  { size: "XL", chest: "105–110", waist: "87–92", hip: "111–116" },
];

// Accessible modal (Esc to close, backdrop click, focus-trap-lite) with a
// generic apparel measurement table. Measurements in centimetres.
export default function SizeGuide({ open, onClose }) {
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
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-bone p-8 shadow-2xl [animation:sheetUp_.4s_var(--ease)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-clay">Fit</p>
            <h2 className="display mt-1 text-3xl">Size guide</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted hover:text-ink">
            <X size={22} />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted">
          Body measurements in centimetres. If you're between sizes, we recommend sizing up for a
          relaxed fit.
        </p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="py-2 font-semibold uppercase tracking-wide">Size</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Chest</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Waist</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Hip</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.size} className="border-b border-line">
                <td className="py-2.5 font-semibold">{r.size}</td>
                <td className="py-2.5 text-muted">{r.chest}</td>
                <td className="py-2.5 text-muted">{r.waist}</td>
                <td className="py-2.5 text-muted">{r.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
