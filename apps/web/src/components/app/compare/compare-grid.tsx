import type { CompareColumnVM } from "@/lib/compare-adapter";

import { BristlesReadCard } from "./bristles-read-card";
import { CompareColumnHeader } from "./compare-column-header";
import { ScorecardCell } from "./scorecard-cell";

// The side-by-side grid. Row-based flex layout (a fixed label column + one
// fixed-width column per problem) inside a horizontal-scroll container, so rows
// align without arbitrary grid-template values. Quantitative rows are derived
// from the relational tables; scorecard rows + Bristle's Read from compare_card.
const LABEL = "w-44 shrink-0 px-1 py-3 text-body-sm text-text-secondary";
const CELL = "w-60 shrink-0 px-grid py-3";

const QUANT: { label: string; cell: (c: CompareColumnVM) => string }[] = [
  { label: "Mentions · 60d", cell: (c) => (c.mentions60d != null ? String(c.mentions60d) : "—") },
  { label: "Sources", cell: (c) => `${c.sources.count} of ${c.sources.of}` },
  {
    label: "WTP signals",
    cell: (c) =>
      c.wtp && c.wtp.count > 0
        ? `${c.wtp.count} · ${c.wtp.median != null ? `$${c.wtp.median} (med)` : "—"}`
        : "0 · —",
  },
  { label: "Personas", cell: (c) => (c.persona ? `${c.persona.label} · ${c.persona.pct}%` : "—") },
  {
    label: "Existing solutions",
    cell: (c) => (c.solutions.count === 0 ? "—" : `${c.solutions.count} (${c.solutions.qualifier})`),
  },
  {
    label: "Time since first seen",
    cell: (c) => (c.daysSinceFirstSeen != null ? `${c.daysSinceFirstSeen} days` : "—"),
  },
];

export function CompareGrid({ columns }: { columns: CompareColumnVM[] }) {
  const scoreRows = [
    { label: "Validated demand", pick: (c: CompareColumnVM) => c.card?.validatedDemand },
    { label: "Has direct solution", pick: (c: CompareColumnVM) => c.card?.hasDirectSolution },
    { label: "Persona fit", pick: (c: CompareColumnVM) => c.card?.personaFit },
    { label: "Build effort", pick: (c: CompareColumnVM) => c.card?.buildEffort },
    { label: "Defensibility", pick: (c: CompareColumnVM) => c.card?.defensibility },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex items-stretch">
          <div className={`${LABEL} flex items-end uppercase tracking-wide text-text-tertiary`}>
            Problem
          </div>
          {columns.map((c) => (
            <div key={c.slug} className="w-60 shrink-0 px-grid">
              <CompareColumnHeader column={c} />
            </div>
          ))}
        </div>

        {QUANT.map((r) => (
          <div key={r.label} className="flex border-t border-border-default">
            <div className={LABEL}>{r.label}</div>
            {columns.map((c) => (
              <div key={c.slug} className={`${CELL} font-mono text-text-primary`}>
                {r.cell(c)}
              </div>
            ))}
          </div>
        ))}

        <h2 className="px-1 pb-grid pt-section font-serif text-heading-h3 text-text-primary">
          Qualitative scorecards
        </h2>
        {scoreRows.map((r) => (
          <div key={r.label} className="flex border-t border-border-default">
            <div className={LABEL}>{r.label}</div>
            {columns.map((c) => (
              <div key={c.slug} className={CELL}>
                <ScorecardCell cell={r.pick(c)} />
              </div>
            ))}
          </div>
        ))}

        <div className="flex border-t border-border-default pt-grid">
          <div className={`${LABEL} font-medium uppercase tracking-wide text-text-tertiary`}>
            Bristle&rsquo;s Read
          </div>
          {columns.map((c) => (
            <div key={c.slug} className="w-60 shrink-0 px-grid py-3">
              <BristlesReadCard read={c.card?.bristlesRead ?? null} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
