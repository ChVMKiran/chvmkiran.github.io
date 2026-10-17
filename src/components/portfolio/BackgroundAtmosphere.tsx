"use client";

import { useEffect, useState } from "react";

import { sections } from "@/data/portfolio";
import { useActiveSection } from "@/hooks/useActiveSection";

const sectionIds = sections.map((s) => s.id);

/**
 * The evolving background (spec §31, §32).
 *
 * Six stacked layers, fixed behind the content. Which layers are *visible* is
 * driven by the `data-atmosphere` attribute on <html>, which matches the
 * section currently owning the viewport — so the page shifts from cool cyan in
 * the hero to near-black in Education instead of holding one gradient
 * throughout.
 *
 * All layer transitions are CSS. There is no render loop here.
 */

/**
 * Fixed point field. Positions are hardcoded rather than random so the server
 * and client markup agree — a random field would hydrate differently and
 * produce a mismatch warning.
 */
const POINTS = [
  { left: "8%", top: "18%", delay: "0s", duration: "17s" },
  { left: "16%", top: "62%", delay: "-3s", duration: "21s" },
  { left: "24%", top: "34%", delay: "-7s", duration: "19s" },
  { left: "31%", top: "78%", delay: "-1s", duration: "23s" },
  { left: "38%", top: "12%", delay: "-11s", duration: "18s" },
  { left: "44%", top: "55%", delay: "-5s", duration: "20s" },
  { left: "52%", top: "26%", delay: "-9s", duration: "22s" },
  { left: "58%", top: "84%", delay: "-2s", duration: "17s" },
  { left: "63%", top: "42%", delay: "-13s", duration: "24s" },
  { left: "69%", top: "9%", delay: "-6s", duration: "19s" },
  { left: "74%", top: "68%", delay: "-15s", duration: "21s" },
  { left: "81%", top: "30%", delay: "-4s", duration: "18s" },
  { left: "87%", top: "74%", delay: "-10s", duration: "23s" },
  { left: "92%", top: "48%", delay: "-8s", duration: "20s" },
  { left: "12%", top: "88%", delay: "-14s", duration: "22s" },
  { left: "48%", top: "92%", delay: "-12s", duration: "19s" },
  { left: "66%", top: "16%", delay: "-16s", duration: "25s" },
  { left: "28%", top: "6%", delay: "-2s", duration: "20s" },
] as const;

export function BackgroundAtmosphere() {
  const active = useActiveSection(sectionIds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.atmosphere = active || "home";
  }, [active]);

  // Stop the (few) animations while the tab is hidden — no wasted frames
  // offscreen (spec §39).
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      aria-hidden="true"
      data-paused={paused}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="atmo-layer atmo-base" />
      <div className="atmo-layer atmo-gradient" />
      <div className="atmo-layer atmo-light" />

      <div className="atmo-layer">
        {POINTS.map((point, index) => (
          <span
            key={index}
            className="atmo-point"
            style={{
              left: point.left,
              top: point.top,
              animationDelay: point.delay,
              animationDuration: point.duration,
            }}
          />
        ))}
      </div>

      <div className="atmo-layer atmo-grid" />
      <div className="atmo-layer atmo-noise" />
    </div>
  );
}
