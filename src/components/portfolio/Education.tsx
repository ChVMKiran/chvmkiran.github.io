"use client";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { education } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Education (spec §24).
 *
 * Deliberately the calmest section on the page — typography, whitespace and
 * hairlines only. The drop in visual intensity after Projects is the point, not
 * an oversight.
 */
export function Education() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.2 });
  const shown = inView || reduced;

  return (
    <section
      id="education"
      aria-labelledby="education-title"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div ref={ref} className="mx-auto max-w-[1400px]">
        <SectionRail index="06" label="Education" className="mb-14 sm:mb-20" />

        <div
          className={[
            "grid gap-12 lg:grid-cols-12 lg:gap-8",
            reduced
              ? ""
              : "transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          ].join(" ")}
        >
          <div className="lg:col-span-7">
            <h2 id="education-title" className="t-section text-fg">
              {education.degree}
            </h2>

            <p className="t-body mt-7 max-w-2xl">{education.institution}</p>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <dl className="space-y-0">
              <div className="flex items-baseline justify-between border-t border-line py-4">
                <dt className="t-meta">Duration</dt>
                <dd className="t-label">{education.dates}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line py-4">
                <dt className="t-meta">CGPA</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums text-fg">
                  {education.cgpa}
                </dd>
              </div>
              <div className="border-t border-line py-4">
                <dt className="t-meta mb-3">Focus</dt>
                <dd>
                  <ul className="space-y-2">
                    {education.focus.map((area) => (
                      <li key={area} className="t-label">
                        {area}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
