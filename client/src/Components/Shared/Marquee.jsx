// Running headline band — the Home page's memorable moment. Duplicates its
// content so the CSS translateX(-50%) loop is seamless. Pauses on hover.
export default function Marquee({ items, className = "" }) {
  const content = [...items, ...items];
  return (
    <div className={`overflow-hidden select-none ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {content.map((text, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="display text-[clamp(2.2rem,7vw,5.5rem)] px-6 leading-none">{text}</span>
            <span className="text-clay text-[clamp(1.4rem,4vw,3rem)] px-2">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
