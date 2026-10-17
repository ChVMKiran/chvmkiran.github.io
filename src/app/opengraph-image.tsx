import { ImageResponse } from "next/og";

import { BrandCard, OG_ALT, OG_CONTENT_TYPE, OG_SIZE } from "./_og/brand-card";

/**
 * Social share card (spec §49).
 *
 * Generated from real profile data at build time — nothing here is a picture of
 * something that does not exist. Fonts are left to the renderer's bundled
 * default so the build never depends on a network fetch.
 */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Baked at build time; the card is a pure function of local data. */
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(<BrandCard />, OG_SIZE);
}
