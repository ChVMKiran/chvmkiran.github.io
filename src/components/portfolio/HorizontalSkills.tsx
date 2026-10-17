"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { skillGroups } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The pinned horizontal gallery (spec §13, §14).
 *
 * Vertical scroll drives horizontal travel: the outer section is made tall
 * enough to give the track somewhere to go, and the inner viewport sticks to
 * the top for exactly that distance. When the track runs out, the sticky
 * element releases and ordinary vertical scrolling resumes on its own — no
 * scroll hijacking, no wheel interception.
 *
 * Each slide sits at its own Z. The active one is neutral; neighbours hold a
 * restrained back-tilt, which is what makes the track read as a space being
 * moved through rather than a carousel.
 */

/**
 * Height given to each slide's worth of scroll distance.
 *
 * Exported so the section wrapper can reserve the same height in CSS before
 * hydration — see `.skills-pinned-shell` in globals.css.
 */
export const VH_PER_SLIDE = 85;

export function HorizontalSkills() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  const total = skillGroups.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // 0 when the section's top meets the viewport top, 1 when its bottom meets
    // the viewport bottom — precisely the pinned interval.
    offset: ["start start", "end end"],
  });

  // Each slide occupies exactly one viewport width, so the track must be
  // `total` viewports across and has to travel `total - 1` of them.
  const travel = ((total - 1) / total) * 100;
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${travel}%`]);

  const index = useTransform(scrollYProgress, [0, 1], [0, total - 1]);
  useMotionValueEvent(index, "change", (latest) => {
    const next = Math.max(0, Math.min(total - 1, Math.round(latest)));
    setActive((current) => (current === next ? current : next));
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Skills"
      style={{ height: `${total * VH_PER_SLIDE}vh` }}
      className="relative"
    >
      <div className="pinned-viewport flex flex-col justify-center">
        {/* The rail stays put for the whole horizontal sequence, so the scene
            keeps its heading while the content travels past it. */}
        <div className="pointer-events-none absolute inset-x-6 top-[calc(var(--nav-height)+1.25rem)] mx-auto max-w-[1400px] sm:inset-x-10">
          <SectionRail index="03" label="Skills" />
        </div>

        <motion.div
          /*
           * The width is stated rather than inferred, and it is load-bearing.
           * `.track-horizontal` is a flex row whose children overflow it, and a
           * percentage translate resolves against the element's own border-box —
           * so a track sized only to *contain* its slides measures a single
           * viewport, and the scene crawls one slide's width instead of ever
           * reaching the later categories.
           */
          style={{ ...(reduced ? null : { x }), width: `${total * 100}vw` }}
          className="track-horizontal"
        >
          {skillGroups.map((group, slideIndex) => (
            <article
              key={group.name}
              aria-label={`${group.name}: ${group.skills.join(", ")}`}
              data-active={slideIndex === active ? "true" : "false"}
              className="slide-3d flex h-full w-screen shrink-0 items-center px-6 sm:px-10"
            >
              <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
                {/* Category identity */}
                <div className="lg:col-span-5">
                  <p className="t-meta mb-6 text-accent">
                    {String(slideIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </p>

                  {/* Ghosted index behind the name — pure decoration. */}
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -left-2 -top-14 select-none font-display text-[clamp(6rem,14vw,11rem)] font-bold leading-none text-fg/[0.045]"
                    >
                      {group.index}
                    </span>
                    <h3 className="t-project relative text-fg">{group.name}</h3>
                  </div>

                  <div className="mt-7 flex items-center gap-3">
                    <span className="t-meta">{group.code}</span>
                    <span className="h-px w-16 bg-line-strong" />
                    <span className="t-meta">
                      {String(group.skills.length).padStart(2, "0")} entries
                    </span>
                  </div>

                  {/* Thin geometric furniture, unique to each slide's offset. */}
                  <div aria-hidden="true" className="relative mt-10 hidden h-24 lg:block">
                    <span
                      className="absolute left-0 top-0 h-px bg-line-strong"
                      style={{ width: `${48 + slideIndex * 6}%` }}
                    />
                    <span
                      className="absolute left-0 top-3 h-px bg-line"
                      style={{ width: `${28 + slideIndex * 9}%` }}
                    />
                    <span
                      className="absolute top-0 h-24 w-px bg-line"
                      style={{ left: `${18 + slideIndex * 11}%` }}
                    />
                    <span
                      className="absolute h-1.5 w-1.5 border border-accent/40"
                      style={{ left: `${18 + slideIndex * 11}%`, top: 46 }}
                    />
                  </div>
                </div>

                {/* Skills — a plain list, not a grid of pills */}
                <div className="lg:col-span-6 lg:col-start-7">
                  <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                    {group.skills.map((skill, skillIndex) => (
                      <li
                        key={skill}
                        className="flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                      >
                        <span className="text-[0.95rem] text-fg">{skill}</span>
                        <span className="t-meta shrink-0 text-fg-faint">
                          {String(skillIndex + 1).padStart(2, "0")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </motion.div>

        {/* Scene progress: a hairline that fills, plus the current index. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-10 mx-auto max-w-[1400px] sm:inset-x-10"
        >
          <div className="flex items-center gap-4">
            <span className="t-meta shrink-0">
              {skillGroups[active]?.name ?? ""}
            </span>
            <span className="relative h-px flex-1 bg-line">
              <motion.span
                style={reduced ? { scaleX: 1 } : { scaleX: scrollYProgress }}
                className="absolute inset-0 origin-left bg-accent"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
