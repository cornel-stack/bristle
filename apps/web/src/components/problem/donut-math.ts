// Pure-math helpers for the SourcesCard donut chart (slice-012 DonutChart).
// Hand-rolled SVG arc-path construction — no charting library (zero new
// deps per CLAUDE.md §3 + slice-012 SC-019).

import type { SampleProblemSourceRow } from "./types";

/**
 * Convert polar coordinates (centerX, centerY, radius, angle) to cartesian.
 * The -90 rotation makes 0° point North (12 o'clock); angles advance
 * clockwise. Pure function.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/**
 * Build an SVG `<path d>` string for one donut-arc segment.
 *   Start at outerR @ startAngle, sweep clockwise to outerR @ endAngle,
 *   line inward to innerR @ endAngle, sweep counter-clockwise back to
 *   innerR @ startAngle, close.
 * Pure function.
 */
export function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const p1 = polarToCartesian(cx, cy, outerR, startAngle);
  const p2 = polarToCartesian(cx, cy, outerR, endAngle);
  const p3 = polarToCartesian(cx, cy, innerR, endAngle);
  const p4 = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export interface DonutSegment {
  name: string;
  count: number;
  /** Integer percentage of total (0-100); Math.round'd. */
  pct: number;
  /** SVG `<path d>` string built by describeArc. */
  path: string;
}

export interface BuildDonutSegmentsInput {
  /** Caller is expected to sort rows DESC by count so the palette mapping hits the largest segment first. */
  rows: ReadonlyArray<SampleProblemSourceRow>;
  total: number;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
}

/**
 * Build the segment array with cumulative angles. Pure function — does NOT
 * sort the input rows (caller sorts before calling so the palette mapping
 * in DonutChart applies in the intended visual order).
 */
export function buildDonutSegments(
  input: BuildDonutSegmentsInput,
): ReadonlyArray<DonutSegment> {
  const { rows, total, cx, cy, outerRadius, innerRadius } = input;
  let accAngle = 0;
  const segments: DonutSegment[] = [];
  for (const row of rows) {
    const share = total === 0 ? 0 : row.count / total;
    const sweep = share * 360;
    const startAngle = accAngle;
    const endAngle = accAngle + sweep;
    segments.push({
      name: row.name,
      count: row.count,
      pct: Math.round(share * 100),
      path: describeArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle),
    });
    accAngle = endAngle;
  }
  return segments;
}
