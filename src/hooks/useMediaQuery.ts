"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a media query. Always returns `false` on the server and on the first
 * client render, then settles to the real value — so markup stays hydration-safe.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
