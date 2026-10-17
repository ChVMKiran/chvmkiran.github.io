"use client";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { stats, type Stat } from "@/data/portfolio";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function StatFigure({ stat, index }: { stat: Stat; index: number }) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.5 });
  const current = useCountUp(stat.value, inView, 1400 + index * 180);

  const display =
    stat.decimals !== undefined
      ? current.toFixed(stat.decimals)
      : Math.round(current).toLocaleString("en-US");

  return (
    <div ref={ref} className="relative py-8 lg:py-4">
      {/* Thin separator rather than a card edge (spec §12). */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-px w-full bg-line lg:hidden"
      />

      <div className="t-meta mb-5 text-fg-faint">
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* The figure is content, so it is always present in the DOM for screen
          readers — the count-up only changes what is painted. */}
      <p
        className={[
          "font-display text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-fg tabular-nums",
          reduced ? "" : "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          inView || reduced ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        ].join(" ")}
      >
        {display}
        <span className="text-accent">{stat.suffix}</span>
      </p>

      <p className="t-label mt-4">{stat.label}</p>
      <p className="t-meta mt-1.5">{stat.context}</p>
    </div>
  );
}

/**
 * Quick stats (spec §12).
 *
 * Three enormous figures on hairlines, set like a publication's standing data —
 * explicitly not three rounded cards.
 */
export function Stats() {
  return (
    <section
      id="stats"
      aria-label="Key figures"
      className="relative px-6 pb-24 pt-4 sm:px-10 sm:pb-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionRail index="02" label="By the numbers" className="mb-10 sm:mb-16" />

        <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {stats.map((stat, index) => (
            <div key={stat.label} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <StatFigure stat={stat} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
