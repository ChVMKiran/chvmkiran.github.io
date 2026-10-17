"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import { ProjectVisual } from "@/components/portfolio/ProjectVisual";
import { SectionRail } from "@/components/portfolio/SectionRail";
import { featuredProjects, type Project } from "@/data/portfolio";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Pointer-tilt ceiling on a project frame (spec §20 — small on purpose). */
const TILT = 5;

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="t-meta text-accent">{project.index}</span>
        <span className="h-px w-10 bg-line-strong" />
      </div>

      <h3 className="t-project mt-5 text-fg">{project.title}</h3>

      <p className="t-body mt-5 max-w-lg">{project.description}</p>

      {project.metrics.length > 0 ? (
        <dl className="mt-7 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
          {project.metrics.map((metric) => {
            // Split "99.3% accuracy" into figure + caption for emphasis.
            const [figure, ...rest] = metric.split(" ");
            return (
              <div key={metric} className="border-t border-line pt-3">
                <dt className="sr-only">{metric}</dt>
                <dd>
                  <span className="block font-display text-xl font-semibold text-fg">
                    {figure}
                  </span>
                  <span className="t-meta mt-1 block">{rest.join(" ")}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      <ul className="mt-7 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <li
            key={tech}
            className="border border-line px-3 py-1.5 font-mono text-[11px] tracking-wide text-fg-muted"
          >
            {tech}
          </li>
        ))}
      </ul>

      {project.note ? <p className="t-meta mt-5">{project.note}</p> : null}

      {/* No verified URLs exist for these projects, so no action is rendered —
          the brief forbids inventing links to make the layout look complete
          (spec §17). Add repo/demo values in src/data/portfolio.ts to reveal. */}
    </>
  );
}

function ProjectPanel({
  project,
  index,
  total,
  progress,
  light,
}: {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
  light: boolean;
}) {
  // The timeline is divided into `total + 1` slots, not `total`. Motion hands a
  // useTransform input range to the browser verbatim as WAAPI keyframe offsets
  // (framer-motion/use-transform.mjs), and offsets must lie inside [0,1]. With
  // `total` slots the first panel's entrance range starts at zero minus one
  // segment, the browser rejects the animation outright, and the thrown error
  // escapes a layout effect — which unmounts the entire React tree. The extra
  // slot gives panel one a real entrance instead of a negative one.
  const segment = 1 / (total + 1);
  const start = (index + 1) * segment;
  const enter = start - segment;
  const hold = start + segment * 0.55;
  const isLast = index === total - 1;
  const exit = isLast ? hold : start + segment;

  const depth = light ? -70 : -180;
  const tilt = light ? 1.5 : 4;
  const lift = light ? 16 : 40;

  // Range for the final panel never completes its exit, so the sequence ends
  // with the last project still in frame when the sticky element releases.
  const z = useTransform(progress, [enter, start, hold, exit], [depth, 0, 0, isLast ? 0 : depth]);
  const scale = useTransform(progress, [enter, start, hold, exit], [0.94, 1, 1, isLast ? 1 : 0.9]);
  const rotateX = useTransform(progress, [enter, start, hold, exit], [tilt, 0, 0, isLast ? 0 : tilt]);

  // The last panel holds its exit at `hold` rather than running to the end of
  // its slot: it stays in frame as the sticky element releases, so the sequence
  // never ends on an empty viewport. A four-stop opacity ramp would fade it out
  // at that final instant, so the last panel gets a two-stop ramp instead.
  const opacity = useTransform(
    progress,
    isLast ? [enter, start] : [enter, start, hold, exit],
    isLast ? [0, 1] : [0, 1, 1, 0],
  );

  const restY = useTransform(progress, [enter, start, exit], [lift, 0, light ? -12 : -34]);

  // Pointer tilt lives on an inner element so it never fights the scroll
  // transform on the outer one.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(pointerY, { stiffness: 180, damping: 22 });
  const tiltY = useSpring(pointerX, { stiffness: 180, damping: 22 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2 * TILT);
    pointerY.set(-((event.clientY - rect.top) / rect.height - 0.5) * 2 * TILT);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.article
      style={{ z, scale, rotateX, opacity, y: restY, transformStyle: "preserve-3d" }}
      className="project-panel flex items-center px-6 sm:px-10"
    >
      <motion.div
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
      >
        <div className="lg:col-span-6">
          <ProjectBody project={project} />
        </div>

        {/* Visual frame. Border brightens on hover; the scene is abstract and
            labelled as such rather than passed off as a screenshot. */}
        <div className="lg:col-span-6">
          <div className="group relative border border-line bg-charcoal/40 transition-colors duration-500 hover:border-accent/40">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="t-meta">Abstract visual</span>
              <span className="t-meta">Not a screenshot</span>
            </div>

            <div className="relative aspect-[8/5] overflow-hidden">
              <ProjectVisual variant={project.visual} />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent"
              />
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
              <span className="t-meta">{project.slug}</span>
              <span className="t-meta">{project.index} / 04</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

/** Vertical fallback used when reduced motion is requested (spec §38). */
function StaticFeatured() {
  return (
    <div className="space-y-20 px-6 pb-24 pt-8 sm:px-10">
      {featuredProjects.map((project) => (
        <article key={project.slug} className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <ProjectBody project={project} />
          </div>
          <div className="lg:col-span-6">
            <div className="border border-line bg-charcoal/40">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="t-meta">Abstract visual</span>
                <span className="t-meta">Not a screenshot</span>
              </div>
              <div className="relative aspect-[8/5] overflow-hidden">
                <ProjectVisual variant={project.visual} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Cinematic project sequence (spec §18).
 *
 * A sticky viewport with the four featured projects stacked in Z. Each panel's
 * position is a pure function of one scroll progress value, so the whole
 * sequence costs a single scroll subscription and no render loop.
 */
export function ProjectSequence() {
  const reduced = useReducedMotion();
  const light = useMediaQuery("(max-width: 1023px)");
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const total = featuredProjects.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  if (reduced) return <StaticFeatured />;

  // The extra slot of scroll height keeps each segment at 100vh of travel
  // despite the timeline now being split into `total + 1` parts.
  return (
    <div ref={sectionRef} style={{ height: `${(total + 1) * 100}vh` }} className="relative">
      <div className="pinned-viewport">
        <div className="pointer-events-none absolute inset-x-6 top-[calc(var(--nav-height)+1.25rem)] z-10 mx-auto max-w-[1400px] sm:inset-x-10">
          <SectionRail index="04" label="Projects" />
        </div>

        {featuredProjects.map((project, index) => (
          <ProjectPanel
            key={project.slug}
            project={project}
            index={index}
            total={total}
            progress={scrollYProgress}
            light={light}
          />
        ))}

        {/* Sequence position, bottom-right. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-10 mx-auto hidden max-w-[1400px] items-center gap-4 sm:flex"
        >
          <span className="t-meta shrink-0">Featured</span>
          <span className="relative h-px flex-1 bg-line">
            <motion.span
              style={{ scaleX: scrollYProgress }}
              className="absolute inset-0 origin-left bg-accent"
            />
          </span>
          <span className="t-meta shrink-0">
            {String(featuredProjects.length).padStart(2, "0")} projects
          </span>
        </div>
      </div>
    </div>
  );
}
