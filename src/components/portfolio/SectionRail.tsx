"use client";

import { useInView } from "@/hooks/useInView";

/**
 * Shared section rail: a mono index, a label, and a hairline that draws itself
 * in on entry (spec §11).
 *
 * Not in the spec's component list, but every section needs it and duplicating
 * the markup eight times would guarantee it drifts.
 */
export function SectionRail({
  index,
  label,
  className = "",
}: {
  index: string;
  label: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.4 });

  return (
    <div ref={ref} className={`flex items-center gap-4 ${className}`}>
      <span className="t-meta text-accent">{index}</span>
      <span className="t-meta whitespace-nowrap">{label}</span>
      <span
        aria-hidden="true"
        className="rule-draw h-px flex-1"
        data-drawn={inView ? "true" : "false"}
      />
    </div>
  );
}
