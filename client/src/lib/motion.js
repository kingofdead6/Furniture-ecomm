import { useEffect, useRef } from "react";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-linked parallax. Attach the returned ref to an element inside an
 * `overflow-hidden` box; it drifts by up to `strength` px as it crosses the
 * viewport. Writes a CSS variable on a rAF loop — no re-renders.
 */
export function useParallax(strength = 60) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (just below viewport) → 1 (just above)
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      el.style.setProperty("--py", `${(-progress * strength).toFixed(2)}px`);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength]);

  return ref;
}

/**
 * Magnetic hover: the element leans toward the cursor and springs back on exit.
 * Pointer-driven and skipped entirely for reduced-motion / coarse pointers.
 */
export function useMagnetic(strength = 0.28) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.setProperty("--mx", `${(dx * strength).toFixed(2)}px`);
      el.style.setProperty("--my", `${(dy * strength).toFixed(2)}px`);
    };
    const reset = () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [strength]);

  return ref;
}

/**
 * Counts a number up once it scrolls into view. Returns [containerRef, valueRef]
 * — put the first on the wrapper and the second on the element that shows the
 * number. `format` lets you render currency etc. Falls back to the final value
 * immediately under reduced motion.
 */
export function useCountUp(value, { duration = 1100, format } = {}) {
  const ref = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = Number(value) || 0;

    const write = (n) => {
      if (spanRef.current) spanRef.current.textContent = format ? format(n) : String(n);
    };

    if (reduced()) {
      write(target);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.unobserve(el);
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          write(Math.round(target * eased));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, format]);

  return [ref, spanRef];
}
