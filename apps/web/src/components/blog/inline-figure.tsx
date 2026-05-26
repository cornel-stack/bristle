// Inline placeholder figure for the featured article's section 1 (FIGURE 1).
// Hand-rolled inline SVG line chart per plan §D8 — NO chart library imported.
// Tokens-only colors via Tailwind utilities (stroke-accent-bristle,
// stroke-border-default, fill-text-secondary). The founder swaps the decorative
// SVG for a real chart in a content patch before publishing.
//
// `figure.placeholderText` is a developer-facing field per BlogFigure's TSDoc
// and is NEVER referenced by this component (verified by grep at T-Batch-B).

import type { BlogFigure } from "./types";

export function InlineFigure({ figure }: { figure: BlogFigure }) {
  return (
    <figure className="my-loose flex flex-col gap-tight">
      <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
        {figure.eyebrow}
      </p>
      <svg
        viewBox="0 0 720 200"
        role="img"
        aria-label={figure.caption}
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        {/* 5 horizontal grid lines */}
        <g className="stroke-border-default opacity-40">
          <line x1="0" y1="40" x2="720" y2="40" strokeWidth="1" />
          <line x1="0" y1="80" x2="720" y2="80" strokeWidth="1" />
          <line x1="0" y1="120" x2="720" y2="120" strokeWidth="1" />
          <line x1="0" y1="160" x2="720" y2="160" strokeWidth="1" />
          <line x1="0" y1="200" x2="720" y2="200" strokeWidth="1" />
        </g>
        {/* Rising trend line — 12 data points */}
        <path
          d="M 20 170 L 80 165 L 140 155 L 200 150 L 260 138 L 320 130 L 380 115 L 440 100 L 500 85 L 560 65 L 620 45 L 680 30"
          className="stroke-accent-bristle"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 4 x-axis labels */}
        <g className="fill-text-secondary" fontSize="11">
          <text x="20" y="195" textAnchor="middle">Q1 &apos;24</text>
          <text x="220" y="195" textAnchor="middle">Q3 &apos;24</text>
          <text x="420" y="195" textAnchor="middle">Q1 &apos;25</text>
          <text x="620" y="195" textAnchor="middle">Q4 &apos;25</text>
        </g>
      </svg>
      <figcaption className="text-body-sm text-text-secondary">
        {figure.caption}
      </figcaption>
    </figure>
  );
}
