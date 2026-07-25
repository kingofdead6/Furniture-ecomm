import { useEffect } from "react";
import { X } from "lucide-react";

// Typical footprints (cm) to help judge whether a piece fits a room. These are
// indicative ranges — each product page lists that item's exact dimensions.
const ROWS = [
  { type: "2-seater sofa", w: "150–180", d: "85–95", h: "75–85" },
  { type: "3-seater sofa", w: "200–230", d: "90–100", h: "75–85" },
  { type: "Armchair", w: "70–90", d: "80–90", h: "75–95" },
  { type: "Dining table (4)", w: "120–140", d: "80–90", h: "74–76" },
  { type: "Dining table (6)", w: "180–200", d: "90–100", h: "74–76" },
  { type: "Queen bed", w: "160–170", d: "210–215", h: "40–120" },
];

// Accessible modal (Esc to close, backdrop click) — a furniture dimensions
// helper. All measurements in centimetres.
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
      aria-label="Dimensions guide"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-bone p-8 shadow-2xl [animation:sheetUp_.4s_var(--ease)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-clay">Measure up</p>
            <h2 className="display mt-1 text-3xl">Dimensions guide</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted hover:text-ink">
            <X size={22} />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted">
          Typical footprints in centimetres (W × D × H). Before ordering a large piece, measure your
          space — and the doorways, hallways and stairwells it has to travel through.
        </p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="py-2 font-semibold uppercase tracking-wide">Piece</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Width</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Depth</th>
              <th className="py-2 font-semibold uppercase tracking-wide">Height</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.type} className="border-b border-line">
                <td className="py-2.5 font-semibold">{r.type}</td>
                <td className="py-2.5 text-muted">{r.w}</td>
                <td className="py-2.5 text-muted">{r.d}</td>
                <td className="py-2.5 text-muted">{r.h}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
