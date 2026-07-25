import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center md:px-8">
      <p className="display text-[clamp(6rem,22vw,16rem)] leading-none">404</p>
      <p className="eyebrow mt-2 text-clay">Page not found</p>
      <h1 className="display mt-4 text-3xl">This room is empty.</h1>
      <p className="mt-3 max-w-md text-muted">
        The page you're looking for doesn't exist or has moved. Let's get you back to something good.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link to="/" className="bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid">
          Back home
        </Link>
        <Link to="/products" className="border border-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] btn-line">
          Shop everything
        </Link>
      </div>
    </div>
  );
}
