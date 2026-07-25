import { Fragment, useEffect, useRef, useState } from "react";

// Typographic reveal: each word rises out of a masked baseline, staggered.
// The full string stays in the accessibility tree via aria-label while the
// animated word spans are hidden from screen readers.
export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 70,
  onScroll = false, // wait until scrolled into view instead of animating on mount
}) {
  const ref = useRef(null);
  const [run, setRun] = useState(!onScroll);

  useEffect(() => {
    if (!onScroll) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onScroll]);

  const words = String(text).split(" ");

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="split-word" aria-hidden="true">
            <span
              className="split-inner"
              style={{
                animationDelay: `${delay + i * stagger}ms`,
                // Hold the pre-animation state until it's time to run.
                animationPlayState: run ? "running" : "paused",
              }}
            >
              {word}
            </span>
          </span>
          {/* real whitespace so inline-block words don't run together */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
