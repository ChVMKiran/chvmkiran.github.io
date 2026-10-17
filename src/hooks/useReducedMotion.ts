"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the visitor has asked for reduced motion (spec §38).
 *
 * Deliberately reads the media query rather than a Motion hook so that
 * non-Motion code paths can branch on it too.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True for a precise pointer (mouse/trackpad) — gates the custom cursor (spec §30). */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)");
}
