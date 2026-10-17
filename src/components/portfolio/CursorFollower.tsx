"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

import { useFinePointer, useReducedMotion } from "@/hooks/useReducedMotion";

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]';

/**
 * Refined custom cursor (spec §30): a small centre dot plus a thin ring that
 * trails on a spring, growing slightly over interactive elements.
 *
 * Disabled entirely on touch devices and under reduced motion, where the
 * native cursor is left alone.
 */
export function CursorFollower() {
  const finePointer = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = finePointer && !reduced;

  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  // The ring lags the dot; that lag is the whole effect.
  const ringX = useSpring(dotX, { stiffness: 210, damping: 24, mass: 0.6 });
  const ringY = useSpring(dotY, { stiffness: 210, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.customCursor = "on";
    return () => {
      delete document.documentElement.dataset.customCursor;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      dotX.set(event.clientX);
      dotY.set(event.clientY);
      setVisible(true);
      setHovering(Boolean((event.target as Element | null)?.closest?.(INTERACTIVE)));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, dotX, dotY]);

  if (!enabled) return null;

  /*
   * Layered above every surface in the app, not merely above the page. The
   * cursor is the one element that must never be occluded, and three separate
   * surfaces would otherwise paint over it: the all-projects overlay (120), the
   * guide capsule (125) and the contact toast (130). Sitting at 100 — under all
   * three — is what made it disappear whenever the guide was open.
   */
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[300]">
      <motion.span
        style={{ x: dotX, y: dotY, opacity: visible ? 1 : 0 }}
        className="absolute -ml-[2px] -mt-[2px] block h-[4px] w-[4px] rounded-full bg-accent"
      />

      {/* Position on the outer node, centring on the inner one — so the
          animated size never fights the spring transform. */}
      <motion.div style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }} className="absolute left-0 top-0">
        <div className="absolute -translate-x-1/2 -translate-y-1/2">
          <motion.span
            initial={false}
            animate={{
              width: hovering ? 44 : 26,
              height: hovering ? 44 : 26,
              borderColor: hovering ? "rgba(92,207,230,0.85)" : "rgba(238,241,246,0.32)",
            }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="block rounded-full border"
          />
        </div>
      </motion.div>
    </div>
  );
}
