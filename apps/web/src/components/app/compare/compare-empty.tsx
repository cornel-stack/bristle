import { ComparePicker, type Pickable } from "./compare-picker";

// 0-selected empty state (or the 1-selected "add one more" prompt) with the picker
// to reach a valid (≥2) comparison.
export function CompareEmpty({
  pickable,
  selected,
  max,
  single,
}: {
  pickable: Pickable[];
  selected: string[];
  max: number;
  single: boolean;
}) {
  return (
    <div className="rounded-card border border-border-default bg-surface-card px-grid py-section text-center">
      <p className="text-body-md text-text-secondary">
        {single
          ? "Add at least one more problem to compare."
          : "Pick problems to compare side by side."}
      </p>
      <div className="mt-grid flex justify-center">
        <ComparePicker pickable={pickable} selected={selected} max={max} />
      </div>
    </div>
  );
}
