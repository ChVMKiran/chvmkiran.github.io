import { ImageResponse } from "next/og";

import { BrandCard, OG_ALT, OG_CONTENT_TYPE, OG_SIZE } from "./_og/brand-card";

/**
 * Twitter/X share card (spec §49).
 *
 * Twitter falls back to `og:image` on most crawlers, but Next only emits
 * `twitter:image` from a `twitter-image` file — so this route exists to fill
 * that tag. Both routes render the same shared card, so they cannot drift.
 */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Baked at build time; the card is a pure function of local data. */
export const dynamic = "force-static";

export default function TwitterImage() {
  return new ImageResponse(<BrandCard />, OG_SIZE);
}
