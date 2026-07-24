import { Star } from "lucide-react";

// Compact rating row. Half-stars are rounded to the nearest full for the icon
// fill; the numeric value stays precise beside it when `showValue`.
export default function Stars({ value = 0, count, size = 14, showValue = false, className = "" }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            strokeWidth={1.5}
            className={n <= rounded ? "fill-ink text-ink" : "text-muted/50"}
          />
        ))}
      </span>
      {showValue && value > 0 && <span className="text-xs text-muted">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </span>
  );
}
