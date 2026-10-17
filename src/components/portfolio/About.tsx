"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { profile } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const FOCUS = [
  "Software engineering",
  "Backend systems",
  "Full-stack development",
  "Machine learning integration",
  "Scalable application development",
];

/**
 * Editorial About (spec §10, §11).
 *
 * Deliberately not a two-column "About Me" card: a narrow index rail, an
 * oversized statement that arrives from outside its final position and whose
 * perspective flattens as it settles, then body copy offset to the right with
 * a large amount of negative space left open.
 */
export function About() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const body = useInView<HTMLDivElement>({ once: true, threshold: 0.25 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "end 0.45"],
  });

  // The heading slides inward and flattens: perspective decreasing toward 0.
  const headingX = useTransform(scrollYProgress, [0, 1], [-70, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.45], [0, 1]);
  const headingRotateY = useTransform(scrollYProgress, [0, 1], [9, 0]);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-title"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionRail index="01" label="About" className="mb-12 sm:mb-20" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <motion.div
            className="stage-3d lg:col-span-8"
            style={reduced ? undefined : { perspective: 900 }}
          >
            <motion.h2
              id="about-title"
              style={
                reduced
                  ? undefined
                  : {
                      x: headingX,
                      opacity: headingOpacity,
                      rotateY: headingRotateY,
                      transformPerspective: 900,
                    }
              }
              className="t-section origin-left text-fg"
            >
              ENGINEERING
              <br />
              <span className="text-fg-muted">WITH</span> DEPTH.
            </motion.h2>
          </motion.div>

          {/* Technical metadata, right-aligned against the statement */}
          <dl className="space-y-5 lg:col-span-4 lg:pt-4">
            <div className="border-t border-line pt-3">
              <dt className="t-meta">Focus</dt>
              <dd className="t-label mt-1.5">Software Engineering · AI/ML · Full Stack</dd>
            </div>
            <div className="border-t border-line pt-3">
              <dt className="t-meta">Based in</dt>
              <dd className="t-label mt-1.5">{profile.location}</dd>
            </div>
            <div className="border-t border-line pt-3">
              <dt className="t-meta">Status</dt>
              <dd className="t-label mt-1.5">Final year · open to opportunities</dd>
            </div>
          </dl>
        </div>

        {/* Body copy, offset right — the left half stays open on purpose. */}
        <div
          ref={body.ref}
          className={[
            "mt-16 grid grid-cols-1 gap-10 lg:mt-24 lg:grid-cols-12 lg:gap-8",
            reduced ? "" : "transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            body.inView || reduced ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <div className="lg:col-span-6 lg:col-start-6">
            <div className="space-y-6">
              <p className="t-body">
                I&apos;m a final-year CSE (AI &amp; ML) student at Aditya College of
                Engineering &amp; Technology, working across software engineering, backend
                systems and full-stack development. Most of what I build starts as a data
                problem and ends as a REST API — crop-yield models, sentiment classifiers,
                and inference services that have to hold up under real request load.
              </p>
              <p className="t-body">
                I care most about the parts that are hard to see: schema design, rate
                limits, failure states, and the seam where a model meets an application.
                Alongside coursework I&apos;ve interned at LG Soft India and Technical Hub,
                and I keep a competitive-programming habit — 900+ problems solved on
                LeetCode.
              </p>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {FOCUS.map((item, index) => (
                <li key={item} className="flex items-baseline gap-3 border-t border-line pt-3">
                  <span className="t-meta text-fg-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="t-label">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
