import { Sparkline } from "@bristle/ui";

// DECORATIVE KPI sparklines (A2/D7) — fixed, deterministic shapes, NOT data and NOT
// random. Three of the four KPIs have no real series; uniform chrome beats
// fabricating analytics. Four variants so the tiles differ visually.
const SHAPES = {
  mentions: [3, 4, 4, 5, 6, 5, 7, 8, 7, 9],
  crossed: [2, 2, 3, 3, 4, 3, 5, 4, 5, 6],
  saved: [4, 5, 5, 6, 6, 7, 6, 8, 8, 9],
  alerts: [3, 3, 4, 4, 4, 5, 4, 5, 6, 6],
} as const;

export type KpiVariant = keyof typeof SHAPES;

export function KpiSparkline({ variant }: { variant: KpiVariant }) {
  return (
    <Sparkline
      values={[...SHAPES[variant]]}
      width={64}
      height={24}
      className="text-accent-bristle"
    />
  );
}
