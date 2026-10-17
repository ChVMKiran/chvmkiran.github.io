import type { Project } from "@/data/portfolio";

/**
 * Abstract project visuals (spec §19).
 *
 * No screenshots were supplied for any project, and the brief forbids passing
 * invented imagery off as real. So each project gets a purpose-drawn geometric
 * composition instead — built from the project's own character (an ML pipeline,
 * an auth boundary, a tier ladder, a sentiment axis) and labelled as abstract
 * in the panel. Decorative throughout, so it is hidden from assistive tech;
 * the panel's real text carries the meaning.
 *
 * Note on ordering: `stroke` is spread FIRST in every element that uses it, so
 * an explicit attribute after it wins. This object supplies `fill: "none"` as
 * the default for stroked shapes.
 */

const stroke = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ProjectVisual({ variant }: { variant: Project["visual"] }) {
  return (
    <svg
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* Shared grid backdrop — keeps all four in one visual language. */}
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="300" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 60} x2="480" y2={i * 60} />
        ))}
      </g>

      {variant === "pipeline" && (
        <g>
          {/* Input nodes → inference → a predicted yield curve. */}
          <g stroke="rgba(92,207,230,0.5)" strokeWidth="1.25" {...stroke}>
            <rect x="46" y="70" width="26" height="26" />
            <rect x="46" y="132" width="26" height="26" />
            <rect x="46" y="194" width="26" height="26" />
          </g>
          <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" {...stroke}>
            <path d="M72 83 H118 M72 145 H118 M72 207 H118" />
            <path d="M118 83 V207" />
            <path d="M118 145 H164" />
          </g>
          <rect
            {...stroke}
            x="164"
            y="118"
            width="54"
            height="54"
            stroke="rgba(92,207,230,0.75)"
            strokeWidth="1.25"
          />
          <path
            {...stroke}
            d="M218 145 H258 C300 145 300 92 340 84 C372 78 396 62 424 48"
            stroke="rgba(92,207,230,0.85)"
            strokeWidth="1.5"
          />
          <g fill="rgba(123,108,246,0.9)">
            {[268, 300, 340, 384, 424].map((cx, i) => (
              <circle key={cx} cx={cx} cy={[142, 122, 84, 68, 48][i]} r="2.5" />
            ))}
          </g>
          <g stroke="rgba(255,255,255,0.12)" strokeWidth="1" {...stroke}>
            <path d="M258 240 V56 M250 240 H436" />
          </g>
          <text
            x="258"
            y="262"
            fill="rgba(255,255,255,0.28)"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="1.6"
          >
            YIELD
          </text>
        </g>
      )}

      {variant === "cipher" && (
        <g>
          {/* A sealed boundary, and a field of hashed values inside it. */}
          <rect
            {...stroke}
            x="150"
            y="58"
            width="180"
            height="184"
            rx="8"
            stroke="rgba(92,207,230,0.6)"
            strokeWidth="1.25"
          />
          <rect
            {...stroke}
            x="164"
            y="72"
            width="152"
            height="156"
            rx="4"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
          <g fill="rgba(255,255,255,0.3)">
            {Array.from({ length: 48 }, (_, i) => {
              const col = i % 8;
              const row = Math.floor(i / 8);
              return (
                <rect
                  key={i}
                  x={180 + col * 17}
                  y={88 + row * 22}
                  width="9"
                  height="3"
                  rx="1.5"
                />
              );
            })}
          </g>
          <g fill="rgba(92,207,230,0.85)">
            {[
              [180, 88],
              [214, 110],
              [265, 88],
              [316, 132],
              [197, 176],
              [299, 198],
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="9" height="3" rx="1.5" />
            ))}
          </g>
          <g stroke="rgba(123,108,246,0.7)" strokeWidth="1.25" {...stroke}>
            <circle cx="240" cy="150" r="17" />
            <path d="M240 141 V152" />
          </g>
          <g stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 5" {...stroke}>
            <path d="M40 58 H138 M342 242 H440 M40 242 H138" />
          </g>
        </g>
      )}

      {variant === "ladder" && (
        <g>
          {/* Ascending tiers on a single spine. */}
          <path {...stroke} d="M86 250 V46" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 232 - i * 42;
            const width = 92 + i * 54;
            const isCurrent = i === 2;
            return (
              <g key={i}>
                <rect
                  {...stroke}
                  x="86"
                  y={y - 22}
                  width={width}
                  height="34"
                  stroke={isCurrent ? "rgba(92,207,230,0.85)" : "rgba(255,255,255,0.16)"}
                  strokeWidth="1.25"
                  fill={isCurrent ? "rgba(92,207,230,0.07)" : "none"}
                />
                <rect
                  x="98"
                  y={y - 8}
                  width={width * 0.42}
                  height="3"
                  rx="1.5"
                  fill={isCurrent ? "rgba(92,207,230,0.7)" : "rgba(255,255,255,0.24)"}
                />
                <text
                  x="86"
                  y={y + 26}
                  fill="rgba(255,255,255,0.26)"
                  fontSize="9"
                  fontFamily="monospace"
                  letterSpacing="1.4"
                >
                  {`TIER 0${i + 1}`}
                </text>
              </g>
            );
          })}
          <circle cx="86" cy="148" r="5" fill="rgba(92,207,230,0.9)" />
          <path
            {...stroke}
            d="M400 250 V46"
            stroke="rgba(123,108,246,0.35)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </g>
      )}

      {variant === "polarity" && (
        <g>
          {/* A diverging axis: negative left, positive right. */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const y = 62 + i * 27;
            const widths = [58, 96, 40, 74, 110, 52, 30];
            const polarities = [-1, 1, -1, 1, 1, -1, 1];
            const w = widths[i] * (polarities[i] > 0 ? 1 : 0.72);
            return (
              <rect
                key={i}
                x={polarities[i] > 0 ? 240 : 240 - w}
                y={y}
                width={w}
                height="7"
                rx="3.5"
                fill={polarities[i] > 0 ? "rgba(92,207,230,0.55)" : "rgba(123,108,246,0.42)"}
              />
            );
          })}
          <path {...stroke} d="M240 44 V262" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
          <g stroke="rgba(255,255,255,0.1)" strokeWidth="1" {...stroke}>
            <path d="M60 44 V262 M420 44 V262" />
          </g>
          <text
            x="60"
            y="284"
            fill="rgba(255,255,255,0.26)"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="1.6"
          >
            NEGATIVE
          </text>
          <text
            x="356"
            y="284"
            fill="rgba(255,255,255,0.26)"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="1.6"
          >
            POSITIVE
          </text>
        </g>
      )}
    </svg>
  );
}
