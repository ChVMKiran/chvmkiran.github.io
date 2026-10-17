"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import { projects } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * All-projects overlay (spec §21).
 *
 * An overlay rather than a second route: it keeps the visitor inside the
 * experience and avoids shipping an almost-empty page. Escape closes it, the
 * page behind cannot scroll while it is open, focus is trapped inside and
 * returned to the trigger on close.
 */
export function AllProjects({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      // Keep focus inside the dialog.
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[120] flex items-stretch justify-center bg-ink/92 backdrop-blur-md"
        >
          {/* Click-outside to dismiss. */}
          <button
            type="button"
            aria-label="Close project list"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            tabIndex={-1}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-projects-title"
            initial={reduced ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: 20, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full flex-col border-x border-line bg-ink/70"
          >
            <header className="shrink-0 border-b border-line px-6 py-5 sm:px-10">
              <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-6">
                <div>
                  <p className="t-meta mb-2 text-accent">Index</p>
                  <h2 id="all-projects-title" className="t-project text-fg">
                    All {projects.length} projects
                  </h2>
                  <p className="t-meta mt-3">
                    Repository links appear here once published.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 border border-line-strong px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
                >
                  Close
                  <span className="ml-2 text-fg-faint">Esc</span>
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8 sm:px-10">
              <ul className="mx-auto max-w-[1400px] divide-y divide-line">
                {projects.map((project) => (
                  <li key={project.slug} className="grid gap-4 py-7 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-1">
                      <span className="t-meta text-accent">{project.index}</span>
                    </div>

                    <div className="lg:col-span-5">
                      <h3 className="text-xl font-semibold tracking-[-0.02em] text-fg">
                        {project.title}
                      </h3>
                      {project.note ? (
                        <p className="t-meta mt-2">{project.note}</p>
                      ) : null}
                      {project.featured ? (
                        <p className="t-meta mt-2 text-accent">Featured</p>
                      ) : null}
                    </div>

                    <div className="lg:col-span-4">
                      <p className="t-body text-[0.95rem]">{project.description}</p>

                      {project.metrics.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {project.metrics.map((metric) => (
                            <li key={metric} className="t-meta text-fg-muted">
                              {metric}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="lg:col-span-2">
                      <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
                        {project.tech.map((tech) => (
                          <li
                            key={tech}
                            className="border border-line px-2 py-1 font-mono text-[10px] tracking-wide text-fg-faint"
                          >
                            {tech}
                          </li>
                        ))}
                      </ul>

                      {/* Actions render only for verified URLs (spec §17). */}
                      {project.repo || project.demo ? (
                        <div className="mt-4 flex flex-col gap-2">
                          {project.repo ? (
                            <a
                              href={project.repo}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="t-meta text-accent underline-offset-4 hover:underline"
                            >
                              Repository ↗
                            </a>
                          ) : null}
                          {project.demo ? (
                            <a
                              href={project.demo}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="t-meta text-accent underline-offset-4 hover:underline"
                            >
                              Live demo ↗
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
