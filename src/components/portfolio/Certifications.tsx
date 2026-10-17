"use client";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { certifications } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Certifications (spec §25).
 *
 * An editorial list, not a badge wall. Issuers are shown because they are part
 * of the certification's identity, not as decoration.
 */
export function Certifications() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.15 });
  const shown = inView || reduced;

  return (
    <section
      id="certifications"
      aria-labelledby="certifications-title"
      className="relative px-6 pb-24 pt-4 sm:px-10 sm:pb-32"
    >
      <div ref={ref} className="mx-auto max-w-[1400px]">
        <SectionRail index="07" label="Certifications" className="mb-12 sm:mb-16" />

        <h2
          id="certifications-title"
          className="t-project mb-10 max-w-2xl text-fg sm:mb-14"
        >
          VERIFIED CREDENTIALS.
        </h2>

        <ol>
          {certifications.map((certification, index) => (
            <li
              key={certification.name}
              style={{ transitionDelay: reduced ? undefined : `${index * 60}ms` }}
              className={[
                "group grid grid-cols-1 items-baseline gap-2 border-t border-line py-5 sm:grid-cols-12 sm:gap-6",
                reduced
                  ? ""
                  : "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              ].join(" ")}
            >
              <span className="t-meta sm:col-span-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-base text-fg sm:col-span-7 sm:text-lg">
                {certification.name}
              </span>
              <span className="t-meta sm:col-span-4 sm:text-right">
                {certification.issuer}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
