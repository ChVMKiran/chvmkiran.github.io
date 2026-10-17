"use client";

import { useState } from "react";

import { AllProjects } from "@/components/portfolio/AllProjects";
import { ProjectSequence } from "@/components/portfolio/ProjectSequence";
import { featuredProjects, projects } from "@/data/portfolio";

/**
 * Projects — the strongest engineering-focused section (spec §15).
 *
 * A cinematic sequence for the four featured projects, with the remaining five
 * available in the overlay rather than demoted to a card grid.
 */
export function Projects() {
  const [open, setOpen] = useState(false);
  const remaining = projects.length - featuredProjects.length;

  return (
    <section id="projects" aria-label="Projects" className="relative">
      <ProjectSequence />

      <div className="px-6 pb-24 pt-4 sm:px-10 sm:pb-32">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-body max-w-xl">
            Four featured builds above, covering an ML prediction platform, an
            authenticated notes service, a browser-based code evaluator, and a
            sentiment classifier. {remaining} smaller projects are indexed too.
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex shrink-0 items-center gap-2.5 self-start border border-line-strong px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
          >
            All {projects.length} projects
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        </div>
      </div>

      <AllProjects open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
