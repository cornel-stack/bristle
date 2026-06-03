// Segmented step indicator in the onboarding header (server component). Renders
// `total` thin pills; the first `current` are filled with the brand accent, the
// rest sit at border/default. Exposed as a single progressbar to assistive tech;
// the individual pills are decorative (aria-hidden). Token-driven, no hex.

interface ProgressDashesProps {
  current: number;
  total: number;
}

export function ProgressDashes({ current, total }: ProgressDashesProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
      className="flex items-center gap-tight"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-1 w-6 rounded-pill ${
            index < current ? "bg-accent-bristle" : "bg-border-default"
          }`}
        />
      ))}
    </div>
  );
}
