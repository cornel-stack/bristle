"use client";

// Frequency tab — WRAP (not the public FrequencyChart component): that leaf
// hardcodes its caption ("47 mentions · +312% MoM") and renders no validation-
// threshold marker, so it can't represent a non-hero problem or page 2's
// threshold line without editing it (forbidden — A2). This in-app chart reuses
// the pure `buildLinePath` math (no charting dep, §9.5) and renders a data-driven
// caption + the threshold marker. The window toggle re-renders instantly
// (reduced-motion safe — no transition).

import { useState } from "react";

import { buildLinePath } from "@/components/problem/frequency-math";
import type { DetailViewModel, FrequencyWindow } from "@/lib/problem-detail-adapter";

const WINDOWS: FrequencyWindow[] = ["7d", "30d", "90d", "all"];
const WINDOW_LABEL: Record<FrequencyWindow, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  all: "All",
};

export function FrequencyPanel({ frequency }: { frequency: DetailViewModel["frequency"] }) {
  const [active, setActive] = useState<FrequencyWindow>("90d");
  const points = frequency.data[active];
  const { pathD, dots, xTicks } = buildLinePath(points);

  const thresholdIdx =
    frequency.thresholdDate != null
      ? points.findIndex((p) => p.date === frequency.thresholdDate)
      : -1;
  const thresholdX = thresholdIdx >= 0 ? dots[thresholdIdx]?.x ?? null : null;

  const deltaSign = frequency.priorDeltaPct >= 0 ? "+" : "";

  return (
    <figure className="rounded-card border border-border-default bg-surface-card p-grid">
      <header className="mb-grid flex flex-wrap items-baseline justify-between gap-grid">
        <div>
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            Frequency &middot; last 90 days
          </p>
          <h2 className="mt-snug font-serif text-heading-h3 text-text-primary">
            {frequency.totalMentions} mentions &middot; {deltaSign}
            {frequency.priorDeltaPct}% vs prior period
          </h2>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-2">
          {WINDOWS.map((w) => {
            const isActive = active === w;
            return (
              <button
                key={w}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(w)}
                className={
                  isActive
                    ? "rounded-button bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card"
                    : "rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
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
        aria-label={`Mention frequency over the ${active} window`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {thresholdX != null ? (
          <g>
            <line
              x1={thresholdX}
              y1={20}
              x2={thresholdX}
              y2={320}
              className="stroke-border-strong"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={thresholdX}
              y={14}
              textAnchor="middle"
              className="fill-text-tertiary font-mono"
              fontSize="13"
            >
              validation threshold
            </text>
          </g>
        ) : null}
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
        <path d={pathD} className="fill-none stroke-accent-bristle" strokeWidth="2" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="3" className="fill-accent-bristle" />
        ))}
      </svg>
    </figure>
  );
}
