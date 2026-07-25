import { useEffect } from "react";

// A hairline reading-progress rule pinned to the top of the viewport.
// Writes a CSS custom property rather than React state so scrolling never
// triggers a re-render.
export default function ScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let ticking = false;

    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? root.scrollTop / max : 0;
      root.style.setProperty("--sp", String(Math.min(1, Math.max(0, ratio))));
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
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
