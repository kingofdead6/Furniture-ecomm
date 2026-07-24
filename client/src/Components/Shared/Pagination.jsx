import { ChevronLeft, ChevronRight } from "lucide-react";

// Minimal numbered pager. Collapses long ranges around the current page.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (p) => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) push(p);
    else if (pages[pages.length - 1] !== "…") push("…");
  }

  const btn = "grid h-10 min-w-10 place-items-center border text-sm transition-colors";

  return (
    <nav className="mt-16 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border-line disabled:opacity-30 enabled:hover:bg-ink enabled:hover:text-bone`}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${btn} ${
              p === page ? "border-ink bg-ink text-bone" : "border-line hover:bg-ink hover:text-bone"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} border-line disabled:opacity-30 enabled:hover:bg-ink enabled:hover:text-bone`}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
