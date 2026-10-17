"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { experience } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Entry = (typeof experience)[number];

/**
 * One timeline entry.
 *
 * Focus is a continuous function of where the entry sits in the viewport: it
 * peaks when the entry crosses the middle band and falls away on both sides.
 * That drives sharpness, brightness, scale and depth together, so an entry
 * resolves as it arrives rather than snapping in and out (spec §23).
 */
function ExperienceEntry({ entry, index }: { entry: Entry; index: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLLIElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.32, 1, 0.32]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.97]);
  const z = useTransform(scrollYProgress, [0, 0.5, 1], [-60, 0, -60]);
  const filter = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["blur(3px)", "blur(0px)", "blur(3px)"],
  );

  if (reduced) {
    return (
      <li className="relative grid gap-5 py-10 pl-8 sm:pl-14 lg:grid-cols-12 lg:gap-8">
        <ExperienceCopy entry={entry} index={index} />
      </li>
    );
  }

  return (
    <motion.li
      ref={ref}
      style={{ opacity, scale, z, filter, transformStyle: "preserve-3d" }}
      className="stage-3d relative grid gap-5 py-10 pl-8 sm:pl-14 lg:grid-cols-12 lg:gap-8"
    >
      <ExperienceCopy entry={entry} index={index} />
    </motion.li>
  );
}

function ExperienceCopy({ entry, index }: { entry: Entry; index: number }) {
  return (
    <>
      {/* Node on the guide line */}
      <span
        aria-hidden="true"
        className={[
          "absolute left-0 top-[3.6rem] h-2 w-2 -translate-x-1/2 rounded-full",
          entry.current ? "bg-accent" : "bg-fg-faint",
        ].join(" ")}
        style={{ left: 0 }}
      />

      <div className="lg:col-span-3">
        <p className="t-meta text-accent">{entry.index}</p>
        <p className="t-meta mt-2">{entry.period}</p>
        {entry.current ? (
          <p className="t-meta mt-2 flex items-center gap-2 text-fg-muted">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Current
          </p>
        ) : null}
      </div>

      <div className="lg:col-span-4">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-fg sm:text-2xl">
          {entry.role}
        </h3>
        <p className="t-label mt-2">{entry.org}</p>
      </div>

      <div className="lg:col-span-5">
        <p className="t-body text-[0.95rem]">{entry.description}</p>
        <span className="t-meta mt-4 block">Entry {String(index + 1).padStart(2, "0")}</span>
      </div>
    </>
  );
}

/**
 * Experience as a spatial timeline (spec §22, §23).
 *
 * A single guide line runs the height of the section; entries travel through a
 * focus region alongside it. Only verified details are shown — no salary, team
 * size, tooling or performance claims beyond what was supplied.
 */
export function Experience() {
  const reduced = useReducedMotion();

  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionRail index="05" label="Experience" className="mb-12 sm:mb-16" />

        <h2 id="experience-title" className="t-section mb-16 max-w-3xl text-fg sm:mb-20">
          WHERE I&apos;VE
          <br />
          <span className="text-fg-muted">WORKED.</span>
        </h2>

        <div className="relative">
          {/* Fixed guide line. The accent segment tracks scroll progress
              through the section. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 top-0 w-px bg-line"
          />
          {!reduced ? (
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-0 w-px origin-top bg-accent/50"
              style={{ height: "100%" }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}

          <ol className="relative">
            {experience.map((entry, index) => (
              <ExperienceEntry key={`${entry.org}-${entry.period}`} entry={entry} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
