"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Stop observing after the first intersection. Default false. */
  once?: boolean;
  /** Fraction of the element that must be visible. Default 0.18. */
  threshold?: number;
  /** Shrinks the viewport so reveals trigger slightly inside the fold. */
  rootMargin?: string;
};

/**
 * Reports whether an element is in view.
 *
 * Used for reveals rather than a scroll handler, so offscreen work stops on its
 * own (spec §39) and no element is left permanently invisible if the observer
 * never fires.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = false,
  threshold = 0.18,
  rootMargin = "0px 0px -12% 0px",
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Without IntersectionObserver, show the content rather than hiding it.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}
