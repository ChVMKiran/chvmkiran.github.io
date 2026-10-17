"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { profile, sections } from "@/data/portfolio";
import { useActiveSection } from "@/hooks/useActiveSection";

const sectionIds = sections.map((s) => s.id);

/**
 * Fixed navigation (spec §9).
 *
 * Minimal and transparent over the hero, then a slightly darker surface with a
 * hairline border and reduced height once scrolled. Deliberately not a large
 * glass bar: the surface stays thin enough to read the page through.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const active = useActiveSection(sectionIds);
  const { scrollY } = useScroll();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Escape closes; focus returns to the control that opened the panel.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        toggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  // A resize back to desktop should never leave the panel stranded open.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && close();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [close]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-[80] border-b transition-[background-color,border-color,backdrop-filter,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled
          ? "border-line bg-ink/72 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-10",
          scrolled ? "h-[60px]" : "h-[76px]",
        ].join(" ")}
      >
        {/* Brand mark — a monogram, not a logo lockup. */}
        <a
          href="#home"
          className="group flex items-center gap-2.5"
          aria-label={`${profile.name} — back to top`}
        >
          <span className="grid h-7 w-7 place-items-center border border-line-strong font-mono text-[10px] font-bold tracking-tight text-accent transition-colors group-hover:border-accent/60">
            CK
          </span>
          <span className="t-meta hidden text-fg-muted transition-colors group-hover:text-fg sm:block">
            Ch V M Kiran
          </span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {sections.map((section) => {
              const isActive = active === section.id;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "relative block px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors",
                      isActive ? "text-accent" : "text-fg-muted hover:text-fg",
                    ].join(" ")}
                  >
                    {section.label}
                    {/* Active indicator: a hairline that draws in. */}
                    <span
                      aria-hidden="true"
                      className={[
                        "absolute inset-x-3 -bottom-px h-px origin-left bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isActive ? "scale-x-100" : "scale-x-0",
                      ].join(" ")}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Only rendered when a real resume file exists (spec §17, §50). */}
          {profile.resumeUrl ? (
            <a
              href={profile.resumeUrl}
              download="ChVMKiran_SDE_Resume.pdf"
              className="hidden border border-line-strong px-4 py-2 font-mono text-[11px] uppercase tracking-[0.13em] text-fg transition-colors hover:border-accent/60 hover:text-accent sm:block"
            >
              Resume
            </a>
          ) : null}

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="grid h-10 w-10 place-items-center border border-line-strong text-fg transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={[
                  "absolute left-0 block h-px w-full bg-current transition-transform duration-300",
                  open ? "top-1.5 rotate-45" : "top-0",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-1.5 block h-px w-full bg-current transition-opacity duration-300",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 block h-px w-full bg-current transition-transform duration-300",
                  open ? "top-1.5 -rotate-45" : "top-3",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-[1400px] px-6 py-4 sm:px-10">
          <ul className="divide-y divide-line">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={close}
                  aria-current={active === section.id ? "true" : undefined}
                  className={[
                    "flex items-baseline justify-between py-3.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                    active === section.id ? "text-accent" : "text-fg-muted hover:text-fg",
                  ].join(" ")}
                >
                  <span>{section.label}</span>
                  <span className="text-[10px] text-fg-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {profile.resumeUrl ? (
            <a
              href={profile.resumeUrl}
              download="ChVMKiran_SDE_Resume.pdf"
              onClick={close}
              className="mt-5 block border border-line-strong px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/60 hover:text-accent"
            >
              Download Resume
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
