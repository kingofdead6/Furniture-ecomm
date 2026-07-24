import { Link } from "react-router-dom";

// ── Skeletons ────────────────────────────────────────────────────────────────
export function Box({ className = "" }) {
  return <div className={`skeleton rounded-none ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Box className="aspect-[3/4] w-full" />
      <Box className="mt-4 h-3 w-1/3" />
      <Box className="mt-2 h-4 w-2/3" />
      <Box className="mt-2 h-3 w-1/4" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LineSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ title, message, action }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h2 className="display text-3xl">{title}</h2>
      {message && <p className="mt-3 text-muted">{message}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-bone"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────────
export function ErrorState({ message = "We couldn't load this right now.", onRetry }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="eyebrow text-clay">Something went wrong</p>
      <h2 className="display mt-3 text-3xl">Out of stock, momentarily</h2>
      <p className="mt-3 text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-bone"
        >
          Try again
        </button>
      )}
    </div>
  );
}
