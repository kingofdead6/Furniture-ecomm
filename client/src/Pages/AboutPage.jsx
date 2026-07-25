import { Link } from "react-router-dom";
import Reveal from "../Components/Shared/Reveal";
import { store } from "../store.config.js";

const IMG_A = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1100&q=80";
const IMG_B = "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1100&q=80";

const VALUES = [
  { n: "01", title: "Considered, not disposable", body: "We design a small range and keep it. Pieces are made to be lived with for years, not swapped out every season." },
  { n: "02", title: "Honest materials", body: "Solid oak and walnut, wool, linen and natural stone. We choose materials that age well and tell you exactly what's in each piece." },
  { n: "03", title: "Built to last", body: "Real joinery, sprung seats, kiln-dried frames. If it isn't built to outlast a house move or two, we don't make it." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Intro */}
      <section className="mx-auto max-w-[1400px] px-5 pb-10 pt-16 md:px-8">
        <p className="eyebrow text-clay">Our story</p>
        <h1 className="display mt-5 max-w-4xl text-[clamp(2.5rem,8vw,6.5rem)]">
          Furniture for a home that stays.
        </h1>
      </section>

      {/* Pull-quote — the memorable moment */}
      <section className="border-y border-line py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <Reveal>
            <p className="display text-[clamp(1.8rem,5vw,4rem)] leading-[1.08]">
              We started {store.brand.name} because we were tired of furniture that didn't last a
              move. Make fewer things, make them properly, and let a home settle in around them.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Two-up imagery + copy */}
      <section className="mx-auto grid max-w-[1400px] gap-8 px-5 py-20 md:grid-cols-2 md:px-8">
        <Reveal className="md:pt-16">
          <div className="aspect-[4/5] bg-paper">
            <img src={IMG_A} alt="Maison studio" className="h-full w-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={120} className="flex flex-col justify-center">
          <h2 className="display text-4xl">From Algiers, for every home</h2>
          <p className="mt-5 text-muted">
            Designed in our Algiers studio and delivered across the country, cash on delivery. We work
            with a handful of workshops and in small runs, so the things we make sell out and rarely
            come back — which is rather the point.
          </p>
          <div className="mt-8">
            <div className="aspect-[16/10] bg-paper">
              <img src={IMG_B} alt="Maison timber" className="h-full w-full object-cover" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
          <div className="grid gap-12 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.n} delay={i * 100}>
                <p className="font-display text-5xl text-clay">{v.n}</p>
                <h3 className="mt-4 font-display text-2xl">{v.title}</h3>
                <p className="mt-3 text-muted">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-8">
          <h2 className="display text-[clamp(2rem,5vw,3.5rem)]">See what we've made.</h2>
          <Link to="/products" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid">
            Shop everything
          </Link>
        </div>
      </section>
    </div>
  );
}
