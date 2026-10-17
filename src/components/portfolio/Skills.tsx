"use client";

import type { CSSProperties } from "react";

import { HorizontalSkills, VH_PER_SLIDE } from "@/components/portfolio/HorizontalSkills";
import { SectionRail } from "@/components/portfolio/SectionRail";
import { skillGroups } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function VerticalSkills() {
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.06 });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="space-y-16">
      {skillGroups.map((group, groupIndex) => (
        <article
          key={group.name}
          style={{ transitionDelay: reduced ? undefined : `${groupIndex * 70}ms` }}
          className={[
            reduced
              ? ""
              : "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            inView || reduced ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-baseline gap-4">
            <span className="t-meta text-accent">
              {String(groupIndex + 1).padStart(2, "0")}
            </span>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
              {group.name}
            </h3>
            <span className="t-meta ml-auto shrink-0">{group.code}</span>
          </div>

          <span aria-hidden="true" className="mt-4 block h-px w-full bg-line" />

          <ul className="mt-5 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {group.skills.map((skill) => (
              <li
                key={skill}
                className="border-b border-line py-3 text-[0.95rem] text-fg-muted"
              >
                {skill}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/**
 * Skills section (spec §13, §14, §36).
 *
 * Desktop gets the pinned horizontal gallery. Touch devices and visitors who
 * asked for reduced motion get a clean vertical layout instead — a deliberate
 * redesign rather than a shrunken copy of the desktop scene.
 *
 * Which of the two renders is a JS decision, and `useMediaQuery` must answer
 * `false` until after hydration (that is what keeps the markup hydration-safe).
 * So the tall pinned scene can only appear a frame or two into the page's life,
 * and without help it would shove everything below it down by roughly a
 * thousand pixels at that moment — visible when a visitor reloads part-way down
 * the page or deep-links straight to `#skills`.
 *
 * The fix is to hoist the id and the height reservation into a wrapper that is
 * present in the server HTML, and let CSS reserve the pinned scene's height
 * under exactly the two conditions the JS branches on. The swap then costs no
 * layout at all.
 */
export function Skills() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion();
  const pinned = isDesktop && !reduced;

  return (
    <div
      id="skills"
      className="skills-pinned-shell"
      style={
        {
          "--skills-pinned-height": `${skillGroups.length * VH_PER_SLIDE}vh`,
        } as CSSProperties
      }
    >
      {pinned ? <HorizontalSkills /> : <VerticalSkillsSection />}
    </div>
  );
}

/** The mobile / reduced-motion layout. */
function VerticalSkillsSection() {
  return (
    <section aria-labelledby="skills-title" className="relative px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionRail index="03" label="Skills" className="mb-12 sm:mb-16" />

        <h2 id="skills-title" className="t-section mb-14 max-w-3xl text-fg sm:mb-20">
          A WORKING
          <br />
          <span className="text-fg-muted">TOOLKIT.</span>
        </h2>

        <VerticalSkills />
      </div>
    </section>
  );
}
