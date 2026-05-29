"use client";

// Sole client island under apps/web/src/components/problem/. Owns the
// 7d / 30d / 90d / All time-range toggle; re-renders the hand-rolled SVG
// line chart on toggle. The 4 windowed datasets are pre-bundled at build
// time and passed in as props from the Server parent (ProblemLayout).
//
// Pattern A ARIA on the toggle: <div role="group" aria-label="Time range">
// + per-button aria-pressed. NOT role="tablist" (which would imply tabbed
// content panels — this is a single chart with a windowed view).
//
// Reduced-motion: the chart re-render is instant (no transition). The
// matchMedia fresh-read pattern is sketched here as a no-op placeholder
// for future cross-fade polish — mirrors the slice-009/010/011 rail
// discipline (read fresh per invocation, never useState-mirror so OS
// preference toggles mid-session are honored).

import { useState } from "react";
import type { FrequencyWindow, SampleProblemFrequencyData } from "./types";
import { buildLinePath } from "./frequency-math";

const WINDOW_ORDER: ReadonlyArray<FrequencyWindow> = ["7d", "30d", "90d", "all"];

const WINDOW_LABEL: Record<FrequencyWindow, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "all": "All",
};

const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface FrequencyChartProps {
  data: SampleProblemFrequencyData;
}

export function FrequencyChart({ data }: FrequencyChartProps) {
  const [activeWindow, setActiveWindow] = useState<FrequencyWindow>("90d");

  function handleSelect(w: FrequencyWindow): void {
    // Fresh-read pattern. Currently a no-op since re-render is instant; the
    // read is here so a future motion-polish slice can branch on the
    // preference without retrofitting the hook order.
    if (typeof window !== "undefined") {
      void window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    }
    setActiveWindow(w);
  }

  const { pathD, dots, xTicks } = buildLinePath(data[activeWindow]);

  return (
    <figure className="rounded-card border border-border-default bg-surface-card p-grid">
      <header className="mb-grid flex flex-wrap items-baseline justify-between gap-grid">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            Frequency &middot; 60 days
          </p>
          <h2 className="mt-snug font-serif text-h2 text-text-primary">
            47 mentions &middot; +312% MoM
          </h2>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-2">
          {WINDOW_ORDER.map((w) => {
            const isActive = activeWindow === w;
            return (
              <button
                key={w}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelect(w)}
                className={
                  isActive
                    ? "rounded-button bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card"
                    : "rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary"
                }
              >
                {WINDOW_LABEL[w]}
              </button>
            );
          })}
        </div>
      </header>
      <svg
        viewBox="0 0 1280 360"
        role="img"
        aria-label={`Frequency chart for the ${activeWindow} window`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {xTicks.map((t) => (
          <text
            key={`${t.label}-${t.x}`}
            x={t.x}
            y={340}
            textAnchor="middle"
            className="fill-text-secondary font-mono"
            fontSize="14"
          >
            {t.label}
          </text>
        ))}
        <path
          d={pathD}
          className="fill-none stroke-accent-bristle"
          strokeWidth="2"
        />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="3" className="fill-accent-bristle" />
        ))}
      </svg>
    </figure>
  );
}
