// Pure-math helpers for the FrequencyChart line chart (slice-012 FrequencyChart).
// Hand-rolled SVG polyline construction — no charting library (zero new
// deps per CLAUDE.md §3 + slice-012 SC-019).

import type { FrequencyPoint } from "./types";

const VIEWBOX_WIDTH = 1280;
const VIEWBOX_HEIGHT = 360;
const PADDING_X = 40;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 40;
const Y_HEADROOM = 1.10;

/** X-tick label rendered along the chart's bottom axis. */
export interface AxisTick {
  x: number;
  label: string;
}

/** Optional Y grid-line label (currently unused but exported for future polish). */
export interface YTick {
  y: number;
  label: string;
}

export interface FrequencyChartGeometry {
  /** SVG `<path d>` string for the polyline (M ... L ... L ... shape, straight segments). */
  pathD: string;
  /** Per-point dot positions for rendering small circles at each data point. */
  dots: ReadonlyArray<{ x: number; y: number }>;
  /** X-axis labels positioned beneath the chart. */
  xTicks: ReadonlyArray<AxisTick>;
  /** Y-axis tick labels (currently empty — future polish hook). */
  yTicks: ReadonlyArray<YTick>;
}

/**
 * Format an ISO yyyy-mm-dd date as "MMM D" (e.g. "2026-02-11" → "FEB 11").
 * Uppercase + space-separated to match the design's x-axis label convention.
 * Pure function — no runtime Intl, no locale dependency.
 */
function formatTickLabel(iso: string): string {
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const month = months[Number(iso.slice(5, 7)) - 1] ?? "";
  const day = String(Number(iso.slice(8, 10)));
  return `${month} ${day}`;
}

/**
 * Build the line-chart geometry from a windowed dataset. Maps each point
 * to (x, y) within the chart's inner box, builds the SVG polyline path
 * string via M+L commands, picks 4 evenly-spaced x-tick labels.
 *
 * Y-axis: inverted (high counts render at top) with 10% headroom above
 * the max count. If all counts are 0, yMax falls back to 1 so the line
 * draws at the bottom.
 *
 * X-axis: linear, evenly-spaced; 4 tick labels picked at indices 0,
 * floor(N/3), floor(2N/3), N-1 (or fewer when N < 4).
 *
 * Pure function. No client-side timing dependency.
 */
export function buildLinePath(
  points: ReadonlyArray<FrequencyPoint>,
): FrequencyChartGeometry {
  if (points.length === 0) {
    return { pathD: "", dots: [], xTicks: [], yTicks: [] };
  }

  const innerW = VIEWBOX_WIDTH - PADDING_X * 2;
  const innerH = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const maxCount = points.reduce((m, p) => (p.count > m ? p.count : m), 0);
  const yMax = (maxCount > 0 ? maxCount : 1) * Y_HEADROOM;

  const dots = points.map((p, i) => {
    const x =
      points.length === 1
        ? PADDING_X + innerW / 2
        : PADDING_X + (i / (points.length - 1)) * innerW;
    const y = PADDING_TOP + innerH - (p.count / yMax) * innerH;
    return { x, y };
  });

  const pathD = dots
    .map((d, i) => `${i === 0 ? "M" : "L"} ${d.x} ${d.y}`)
    .join(" ");

  const tickIndices: number[] = [];
  if (points.length >= 4) {
    tickIndices.push(
      0,
      Math.floor(points.length / 3),
      Math.floor((2 * points.length) / 3),
      points.length - 1,
    );
  } else {
    for (let i = 0; i < points.length; i++) tickIndices.push(i);
  }

  const xTicks: AxisTick[] = [];
  for (const idx of tickIndices) {
    const dot = dots[idx];
    const point = points[idx];
    if (!dot || !point) continue;
    xTicks.push({ x: dot.x, label: formatTickLabel(point.date) });
  }

  return { pathD, dots, xTicks, yTicks: [] };
}
