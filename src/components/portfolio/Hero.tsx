"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { ProfileObject } from "@/components/portfolio/ProfileObject";
import { profile } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Cinematic hero (spec §4, §8).
 *
 * The composition is an L rather than two columns: a full-width metadata rail,
 * the display name running across the page, and the profile object raised so it
 * shares the name's line — the type passes in front of the object, which is
 * what gives the fold its depth. A conventional text-left/image-right split is
 * explicitly what the brief rules out.
 *
 * Scrolling pushes the scene backward rather than just fading it: the content
 * recedes in Z, the name scales down, and the background layers travel at
 * different rates.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Foreground recedes fastest, the object slower, the background slowest.
  const nameY = useTransform(scrollYProgress, [0, 1], [0, -54]);
  const nameScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const contentZ = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const objectY = useTransform(scrollYProgress, [0, 1], [0, -78]);
  const objectZ = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const objectRotate = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const lineY = useTransform(scrollYProgress, [0, 1], [0, 170]);

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden px-6 pb-24 pt-[calc(var(--nav-height)+3rem)] sm:px-10"
    >
      {/* Hero-local spatial furniture: two hairlines and four coordinate
          markers, moving at their own rate against the global atmosphere. */}
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: lineY }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <span className="absolute left-6 top-[30%] hidden h-px w-[38vw] bg-line sm:block" />
        <span className="absolute right-6 top-[68%] hidden h-px w-[26vw] bg-line sm:block" />
        <span className="absolute bottom-0 left-[64%] hidden h-[42vh] w-px bg-line lg:block" />
        <span className="absolute left-[12%] top-[22%] h-1.5 w-1.5 border border-accent/40" />
        <span className="absolute left-[72%] top-[58%] h-1.5 w-1.5 border border-accent/30" />
        <span className="absolute left-[38%] bottom-[18%] h-1.5 w-1.5 border border-accent/30" />
        <span className="absolute right-[8%] top-[16%] h-1.5 w-1.5 border border-accent/40" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: gridY }}
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
      >
        {/* A single faint diagonal plane, so the hero reads as a space rather
            than a flat backdrop. */}
        <span className="absolute -right-[10%] top-[6%] hidden h-[70vh] w-[70vh] rotate-[18deg] border border-line lg:block" />
      </motion.div>

      <div className="stage-3d mx-auto w-full max-w-[1400px]">
        <motion.div
          style={reduced ? undefined : { z: contentZ, opacity: contentOpacity }}
        >
          {/* Top rail — technical metadata, full bleed */}
          <div className="mb-10 border-y border-line py-3 sm:mb-14">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="t-meta flex items-center gap-2 text-accent">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                />
                Open to opportunities
              </span>
              <span className="t-meta">{profile.location}</span>
              <span className="t-meta hidden sm:inline">B.Tech CSE (AI &amp; ML)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-6">
            {/* Display name — full width, running behind the object */}
            <div className="lg:col-span-9 lg:row-start-1">
              <motion.h1
                id="hero-title"
                style={reduced ? undefined : { y: nameY, scale: nameScale }}
                className="t-hero origin-left text-fg"
              >
                <span className="sr-only">{profile.name} — {profile.role}</span>
                <span aria-hidden="true">
                  CH V M
                  <br />
                  KIRAN
                </span>
              </motion.h1>
            </div>

            {/* Profile object — raised to share the display line */}
            <motion.div
              style={reduced ? undefined : { y: objectY, z: objectZ, rotateY: objectRotate }}
              className="lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:-mt-24 xl:-mt-32"
            >
              <ProfileObject />
            </motion.div>

            {/* Role + intro + actions */}
            <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:-mt-6">
              <p className="t-label mb-6 text-accent">{profile.role}</p>

              <p className="t-body max-w-xl">{profile.heroIntro}</p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#projects"
                  className="group inline-flex items-center gap-2.5 bg-fg px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-accent"
                >
                  View Projects
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>

                <a
                  href="#contact"
                  className="inline-flex items-center border border-line-strong px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
                >
                  Contact
                </a>

                {/* Only rendered when a real resume file exists (spec §17, §50). */}
                {profile.resumeUrl ? (
                  <a
                    href={profile.resumeUrl}
                    download="ChVMKiran_SDE_Resume.pdf"
                    className="inline-flex items-center border border-line-strong px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    Download Resume
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div
            aria-hidden="true"
            className="mt-16 hidden items-center gap-3 lg:flex"
          >
            <span className="relative block h-10 w-px overflow-hidden bg-line-strong">
              <motion.span
                className="absolute inset-x-0 top-0 block h-4 bg-accent"
                animate={reduced ? undefined : { y: [-16, 40] }}
                transition={
                  reduced
                    ? undefined
                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                }
              />
            </span>
            <span className="t-meta">Scroll</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
