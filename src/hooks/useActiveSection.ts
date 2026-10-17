"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which section owns the viewport, for the nav's active indicator and
 * the per-section background (spec §9, §32).
 *
 * Uses the median line of the viewport as the deciding edge, so a section
 * becomes active when it genuinely occupies the screen rather than when its
 * top edge first appears.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        // A band across the middle of the viewport.
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
