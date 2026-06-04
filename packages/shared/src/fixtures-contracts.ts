import { z } from "zod";

// Explicit shared Zod contracts for the fixture-only JSON payloads (FR-031). The
// seed validates against these at author time; slices 4.2 (dashboard) and 4.7
// (compare) parse against them at the read boundary; and the v1.1 LLM that later
// replaces these hardcoded values MUST emit the identical shapes. Locked here so
// the JSON columns can never be free-form.

// === compare_card  (problems.compare_card) ==================================
// HARDCODED qualitative scorecards + Bristle's Read ONLY. The QUANTITATIVE
// compare metrics — mentions/60d, sources count, WTP signals, personas, existing
// solutions, time-since-first-seen — are DERIVED from the relational tables
// (problems + child tables) at query time and are deliberately NOT duplicated
// here, so this JSON can never drift from the source-of-truth rows.

export const SCORECARD_TONES = [
  "positive",
  "caution",
  "neutral",
  "negative",
] as const;

export const ScorecardCellSchema = z.object({
  value: z.string(), // the cell text, e.g. "Hookdeck — overkill", "Medium · 2-4 wks"
  tone: z.enum(SCORECARD_TONES), // drives the chip color
});
export type ScorecardCell = z.infer<typeof ScorecardCellSchema>;

// STRONGEST | BUILD-ABLE | WATCH | SKIP
export const BRISTLES_READ_VERDICTS = [
  "strongest",
  "build-able",
  "watch",
  "skip",
] as const;

export const CompareCardSchema = z.object({
  validatedDemand: ScorecardCellSchema,
  hasDirectSolution: ScorecardCellSchema,
  personaFit: ScorecardCellSchema,
  buildEffort: ScorecardCellSchema,
  defensibility: ScorecardCellSchema,
  bristlesRead: z.object({
    verdict: z.enum(BRISTLES_READ_VERDICTS),
    prose: z.string(),
  }),
});
export type CompareCard = z.infer<typeof CompareCardSchema>;

// === weekly_momentum  (dashboard_fixtures.payload, key = "weekly_momentum") ==
// The dashboard weekly-momentum chart: the solid per-category lines + the dashed
// projection line + the editorial caption.

export const MomentumLineSchema = z.object({
  categoryKey: z.string(), // a categories.key (e.g. "devtools")
  points: z.array(z.number()),
});
export type MomentumLine = z.infer<typeof MomentumLineSchema>;

export const WeeklyMomentumSchema = z.object({
  series: z.array(MomentumLineSchema), // the solid category lines
  projection: z
    .object({ label: z.string(), points: z.array(z.number()) })
    .nullable(), // the dashed projection line (null if none)
  caption: z.string(), // "Devtools still leads. AI / ML pulling away on velocity."
});
export type WeeklyMomentum = z.infer<typeof WeeklyMomentumSchema>;

// === categories.momentum_series ==============================================
// Per-category sparkline series — distinct from weekly_momentum.series (the big
// chart's lines). Drives lightweight category-level sparklines.

export const CategoryMomentumSeriesSchema = z.object({
  points: z.array(z.number()),
});
export type CategoryMomentumSeries = z.infer<
  typeof CategoryMomentumSeriesSchema
>;
