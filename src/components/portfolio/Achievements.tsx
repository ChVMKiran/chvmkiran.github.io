"use client";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { achievements } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Achievements as a typographic scene (spec §26).
 *
 * Oversized platform names revealed through a clipping mask, staggered down the
 * page, with the verified figure set as the loudest element in each row. No
 * card, no badge, and no statistic that was not supplied.
 */
export function Achievements() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.12 });
  const shown = inView || reduced;

  return (
    <section
      id="achievements"
      aria-labelledby="achievements-title"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div ref={ref} className="mx-auto max-w-[1400px]">
        <SectionRail index="08" label="Achievements" className="mb-12 sm:mb-16" />

        <h2 id="achievements-title" className="sr-only">
          Achievements
        </h2>

        <ul className="space-y-0">
          {achievements.map((achievement, index) => (
            <li
              key={achievement.platform}
              className="grid grid-cols-1 items-baseline gap-3 border-t border-line py-7 sm:grid-cols-12 sm:gap-6 sm:py-9"
            >
              <div className="sm:col-span-3">
                <p className="t-meta text-accent">{achievement.platform}</p>
              </div>

              {/* The mask reveals from the baseline up, one row at a time. */}
              <div className="sm:col-span-6">
                <p
                  className={[
                    "font-display text-[clamp(2rem,5.6vw,4.25rem)] font-semibold uppercase leading-[0.95] tracking-[-0.035em] text-fg",
                    reduced ? "" : "clip-reveal",
                  ].join(" ")}
                  data-shown={shown ? "true" : "false"}
                  style={{
                    transitionDelay: reduced ? undefined : `${index * 110}ms`,
                  }}
                >
                  {achievement.headline}
                </p>
              </div>

              <div className="sm:col-span-3 sm:text-right">
                <p
                  className={[
                    "t-meta",
                    reduced
                      ? ""
                      : "transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    shown ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                  style={{ transitionDelay: reduced ? undefined : `${index * 110 + 180}ms` }}
                >
                  {achievement.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="t-meta mt-8">
          Figures as verified on each platform. No aggregate rankings are claimed.
        </p>
      </div>
    </section>
  );
}
