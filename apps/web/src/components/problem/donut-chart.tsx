// Hand-rolled SVG donut chart (slice-012 SourcesCard). 4 segments, polar-
// to-cartesian path construction via ./donut-math. Token-driven palette
// per plan §7 Option A — brand highlight on the largest segment, descending
// monochrome text-* tints on the remaining three.
//
// Per-segment <title> is both a native browser tooltip AND the accessible
// name of the SVG <path>. role="img" + aria-label on the <svg> gives a
// summary affordance for screen readers.
//
// noUncheckedIndexedAccess discipline: SEGMENT_FILL_CLASS[i] could be
// undefined when i >= 4; the `?? "fill-text-tertiary"` fallback covers
// any future >4-segment data without breaking the render.

import type { SampleProblemSourceRow } from "./types";
import { buildDonutSegments } from "./donut-math";

const SEGMENT_FILL_CLASS = [
  "fill-accent-bristle", // largest segment — brand highlight
  "fill-text-primary",   // 2nd — dark
  "fill-text-secondary", // 3rd — medium
  "fill-text-tertiary",  // 4th / overflow — light
] as const;

interface DonutChartProps {
  rows: ReadonlyArray<SampleProblemSourceRow>;
  total: number;
  ariaLabel: string;
}

export function DonutChart({ rows, total, ariaLabel }: DonutChartProps) {
  // Sort DESC by count so the palette mapping hits the largest segment first.
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const segments = buildDonutSegments({
    rows: sorted,
    total,
    cx: 120,
    cy: 120,
    outerRadius: 110,
    innerRadius: 72, // 72 / 110 ≈ 0.654 — matches plan §7 ~0.65 ratio
  });

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={ariaLabel}
      className="block h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {segments.map((seg, i) => {
        const fillClass = SEGMENT_FILL_CLASS[i] ?? "fill-text-tertiary";
        return (
          <path key={seg.name} d={seg.path} className={fillClass}>
            <title>{`${seg.name}: ${seg.count} quotes (${seg.pct}%)`}</title>
          </path>
        );
      })}
    </svg>
  );
}
