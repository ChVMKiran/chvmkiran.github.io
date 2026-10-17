"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Thin global page progress indicator (spec §35).
 *
 * A 2px rule at the very top edge. It does not replace the scrollbar and is
 * hidden from assistive tech — position on the page is already conveyed by the
 * document itself.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[90] h-[2px] origin-left bg-gradient-to-r from-accent/70 via-accent to-accent-2/70"
    />
  );
}
