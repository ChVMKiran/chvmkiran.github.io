"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Counts from 0 to `target` once `start` flips true (spec §12).
 *
 * Under reduced motion the final value is returned immediately — the number is
 * content, so it must never depend on an animation having run.
 */
export function useCountUp(target: number, start: boolean, duration = 1500): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }

    let raf = 0;
    const began = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - began) / duration, 1);
      // Quintic ease-out, matching the site's easing token.
      const eased = 1 - Math.pow(1 - progress, 5);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration, reduced]);

  return value;
}
