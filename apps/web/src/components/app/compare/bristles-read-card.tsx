import type { CompareCard } from "@bristle/shared";

type BristlesRead = CompareCard["bristlesRead"];

// Bristle's Read per column — a verdict label (tone-colored) + prose. Strongest /
// Build-able read positive; Watch caution; Skip neutral.
const VERDICT: Record<string, { label: string; tone: string }> = {
  strongest: { label: "Strongest", tone: "text-accent-validated" },
  "build-able": { label: "Build-able", tone: "text-accent-validated" },
  watch: { label: "Watch", tone: "text-status-warning" },
  skip: { label: "Skip", tone: "text-text-secondary" },
};

export function BristlesReadCard({ read }: { read: BristlesRead | null }) {
  if (!read) return <span className="text-body-sm text-text-tertiary">—</span>;
  const v = VERDICT[read.verdict] ?? { label: read.verdict, tone: "text-text-secondary" };
  return (
    <div className="rounded-card border border-border-default bg-surface-raised p-grid">
      <p className={`text-body-sm font-medium uppercase tracking-wide ${v.tone}`}>{v.label}</p>
      <p className="mt-snug text-body-sm text-text-secondary">{read.prose}</p>
    </div>
  );
}
