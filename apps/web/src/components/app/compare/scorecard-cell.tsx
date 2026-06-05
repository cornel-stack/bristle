import type { ScorecardCell as ScorecardCellData } from "@bristle/shared";

// A qualitative scorecard cell — value + tone color (from compare_card; the tone
// drives the chip color). Missing cell → "—".
const TONE_TEXT: Record<string, string> = {
  positive: "text-accent-validated",
  caution: "text-status-warning",
  neutral: "text-text-secondary",
  negative: "text-status-error",
};

export function ScorecardCell({ cell }: { cell: ScorecardCellData | undefined }) {
  if (!cell) return <span className="text-body-sm text-text-tertiary">—</span>;
  return (
    <span
      className={`inline-block rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium ${
        TONE_TEXT[cell.tone] ?? "text-text-secondary"
      }`}
    >
      {cell.value}
    </span>
  );
}
