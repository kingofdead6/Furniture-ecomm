import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// An editorial index where hovering a row floats that item's image alongside
// the cursor and dims the other rows. Pointer-driven, so it is disabled for
// touch and for reduced-motion users (CSS hides the preview); the rows remain
// ordinary links either way.
export default function HoverPreviewList({ items }) {
  const previewRef = useRef(null);
  const frame = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(null);

  // Follow the pointer on a rAF loop with easing, so the image trails softly
  // instead of snapping.
  useEffect(() => {
    const pos = { x: 0, y: 0 };
    let running = true;
    const tick = () => {
      if (!running) return;
      pos.x += (target.current.x - pos.x) * 0.14;
      pos.y += (target.current.y - pos.y) * 0.14;
      const el = previewRef.current;
      if (el) el.style.translate = `${pos.x}px ${pos.y}px`;
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const onMove = useCallback((e) => {
    target.current = { x: e.clientX, y: e.clientY };
  }, []);

  const current = items.find((i) => i.id === active);

  return (
    <>
      <div className="peer-list border-t border-line" onPointerMove={onMove}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="peer-row group flex items-center justify-between border-b border-line py-6"
            onPointerEnter={() => setActive(item.id)}
            onPointerLeave={() => setActive((a) => (a === item.id ? null : a))}
            onFocus={() => setActive(item.id)}
            onBlur={() => setActive((a) => (a === item.id ? null : a))}
          >
            <span className="flex items-baseline gap-4">
              <span className="font-mono text-xs text-muted">{item.index}</span>
              <span className="font-display text-3xl transition-colors group-hover:text-clay md:text-5xl">
                {item.label}
              </span>
            </span>
            <span className="flex items-center gap-4">
              {item.meta && <span className="hidden text-xs uppercase tracking-[0.14em] text-muted sm:inline">{item.meta}</span>}
              <ArrowRight size={26} className="text-muted transition-all group-hover:translate-x-2 group-hover:text-clay" />
            </span>
          </Link>
        ))}
      </div>

      {/* Floating cursor preview — decorative, so hidden from assistive tech. */}
      <div
        ref={previewRef}
        aria-hidden="true"
        className={`hover-preview hidden md:block ${current ? "is-on" : ""}`}
      >
        {current?.image && <img src={current.image} alt="" />}
      </div>
    </>
  );
}
