import type { ChangelogFigureContent } from "./types";

interface ChangelogFigureProps {
  figure: ChangelogFigureContent;
}

// Hand-rolled diagonal-stripes SVG placeholder per plan §D9. Tokens-only:
// fill-surface-raised + stroke-border-strong + fill-text-secondary resolve
// through Tailwind utilities so light/dark mode swap correctly when
// next-themes lands in slice 2.6. The 1280×720 viewBox locks 16:9 aspect.
// `role="img"` + descriptive aria-label signal placeholder nature to AT.
export function ChangelogFigure({ figure }: ChangelogFigureProps) {
  return (
    <figure className="my-grid">
      <svg
        viewBox="0 0 1280 720"
        role="img"
        aria-label={`Screenshot placeholder for ${figure.caption}`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="diagonal-stripes"
            patternUnits="userSpaceOnUse"
            width="24"
            height="24"
            patternTransform="rotate(45)"
          >
            <rect width="24" height="24" className="fill-surface-raised" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              className="stroke-border-strong opacity-30"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect width="1280" height="720" fill="url(#diagonal-stripes)" />
        <text
          x="640"
          y="370"
          textAnchor="middle"
          className="fill-text-secondary font-mono"
          fontSize="22"
        >
          screenshot · {figure.caption} · 1280×720
        </text>
      </svg>
    </figure>
  );
}
