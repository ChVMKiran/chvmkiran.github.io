import { profile } from "@/data/portfolio";

/**
 * The social share card, shared by `opengraph-image.tsx` and `twitter-image.tsx`
 * so the two routes cannot drift apart.
 *
 * `twitter.card` is `summary_large_image`, which renders a wide card with a
 * large image slot — without an image that slot is empty and the card reads as
 * broken. The brief forbids stock imagery and invented screenshots (spec §19,
 * §46), so the card is built from the same vocabulary as the site itself: ink
 * field, hairline geometry, mono metadata, and the real profile facts.
 *
 * This is a private folder (`_og` is not a route), so nothing here is reachable
 * from the browser on its own.
 */

export const OG_ALT = `${profile.name} — ${profile.role}`;
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#04050a";
const FG = "#f4f5f7";
const MUTED = "#7d8494";
const ACCENT = "#5ccfe6";
const LINE = "rgba(255,255,255,0.14)";

export function BrandCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        padding: "68px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Depth motif: two nested frames turned off-axis, the same layered-plane
          language the profile object is built from. Decorative only. */}
      <div
        style={{
          position: "absolute",
          top: -90,
          right: -70,
          width: 420,
          height: 420,
          display: "flex",
          border: `1px solid ${LINE}`,
          transform: "rotate(28deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -20,
          width: 300,
          height: 300,
          display: "flex",
          border: "1px solid rgba(92,207,230,0.22)",
          transform: "rotate(28deg)",
        }}
      />

      {/* Top row — monogram and section label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            border: `1px solid ${LINE}`,
            color: ACCENT,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          CK
        </div>
        <div style={{ display: "flex", color: MUTED, fontSize: 19, letterSpacing: 5 }}>
          PORTFOLIO
        </div>
      </div>

      {/* Identity block */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            width: 64,
            height: 2,
            backgroundColor: ACCENT,
            marginBottom: 34,
          }}
        />
        <div
          style={{
            display: "flex",
            color: FG,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -3.5,
            lineHeight: 1.02,
          }}
        >
          {profile.name.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            color: ACCENT,
            fontSize: 25,
            letterSpacing: 3.4,
            marginTop: 26,
          }}
        >
          {profile.role}
        </div>
      </div>

      {/* Footer rule and metadata */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", height: 1, backgroundColor: LINE }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 22,
            color: MUTED,
            fontSize: 19,
            letterSpacing: 1.6,
          }}
        >
          <div style={{ display: "flex" }}>{profile.siteUrl.replace(/^https?:\/\//, "")}</div>
          <div style={{ display: "flex" }}>{profile.location}</div>
        </div>
      </div>
    </div>
  );
}
