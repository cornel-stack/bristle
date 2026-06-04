import { CATEGORY_LABELS, type WeeklyMomentum } from "@bristle/shared";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Weekly-momentum chart — HAND-ROLLED SVG (no charting dep, §9.5). Server
// component, static (reduced-motion-safe by construction). The category lines +
// the dashed projection share one scale so they're comparable. §4 tokens.
const VIEW_W = 640;
const VIEW_H = 200;

// Per-category line color (design legend: Devtools orange, AI/ML teal, Mobile grey).
const STROKE: Record<string, string> = {
  devtools: "stroke-accent-bristle",
  "ai-ml": "stroke-accent-validated",
  mobile: "stroke-text-tertiary",
};
const DOT: Record<string, string> = {
  devtools: "bg-accent-bristle",
  "ai-ml": "bg-accent-validated",
  mobile: "bg-text-tertiary",
};

function linePath(
  points: number[],
  min: number,
  max: number,
  w: number,
  h: number,
): string {
  if (points.length === 0) return "";
  const range = max - min || 1;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  return points
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function WeeklyMomentumChart({ data }: { data: WeeklyMomentum }) {
  const allValues = [
    ...data.series.flatMap((s) => s.points),
    ...(data.projection?.points ?? []),
  ];
  const min = allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;

  return (
    <section className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card">
      <div className="flex items-start justify-between gap-grid">
        <div className="flex flex-col gap-tight">
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
            Weekly momentum · all categories
          </p>
          <p className="font-serif text-h3 font-semibold text-text-primary">
            {data.caption}
          </p>
        </div>
        <Link
          href="/app/library"
          className="flex shrink-0 items-center gap-tight text-body-sm text-accent-bristle hover:underline"
        >
          Open in Library
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-48 w-full"
        role="img"
        aria-label={`Weekly momentum: ${data.series
          .map((s) => CATEGORY_LABELS[s.categoryKey as keyof typeof CATEGORY_LABELS] ?? s.categoryKey)
          .join(", ")}`}
        preserveAspectRatio="none"
      >
        {data.projection ? (
          <path
            d={linePath(data.projection.points, min, max, VIEW_W, VIEW_H)}
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 5"
            className="stroke-border-strong"
          />
        ) : null}
        {data.series.map((s) => (
          <path
            key={s.categoryKey}
            d={linePath(s.points, min, max, VIEW_W, VIEW_H)}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={STROKE[s.categoryKey] ?? "stroke-text-secondary"}
          />
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-grid">
        {data.series.map((s) => (
          <span
            key={s.categoryKey}
            className="flex items-center gap-tight text-body-sm text-text-secondary"
          >
            <span
              className={`size-2 rounded-pill ${DOT[s.categoryKey] ?? "bg-text-secondary"}`}
              aria-hidden="true"
            />
            {CATEGORY_LABELS[s.categoryKey as keyof typeof CATEGORY_LABELS] ??
              s.categoryKey}
          </span>
        ))}
        {data.projection ? (
          <span className="flex items-center gap-tight text-body-sm text-text-tertiary">
            <span
              className="h-0 w-4 border-t-2 border-dashed border-border-strong"
              aria-hidden="true"
            />
            {data.projection.label}
          </span>
        ) : null}
      </div>
    </section>
  );
}
