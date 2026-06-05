import type { CompareColumnVM } from "@/lib/compare-adapter";

import { CompareEmpty } from "./compare-empty";
import { CompareGrid } from "./compare-grid";
import { ComparePicker, type Pickable } from "./compare-picker";
import { CompareShareBar } from "./compare-share";

const MAX = 4;

// Compare composer — breadcrumb + title + share bar, then the grid (or the
// empty/single state). The picker + the column ×s mutate ?compare=; nothing
// persists (read slice).
export function CompareView({
  columns,
  selectedSlugs,
  pickable,
}: {
  columns: CompareColumnVM[];
  selectedSlugs: string[];
  pickable: Pickable[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-body-sm text-text-secondary">Compare / New comparison</p>
          <h1 className="mt-1 font-serif text-heading-h1 text-text-primary">Compare</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Up to 4 problems, side by side. Bristle aligns metrics and qualitative columns.
          </p>
        </div>
        <CompareShareBar />
      </div>

      {columns.length === 0 ? (
        <div className="mt-section">
          <CompareEmpty pickable={pickable} selected={selectedSlugs} max={MAX} single={false} />
        </div>
      ) : (
        <div className="mt-section flex flex-col gap-section">
          <div className="flex flex-wrap items-center gap-grid">
            <ComparePicker pickable={pickable} selected={selectedSlugs} max={MAX} />
            {columns.length === 1 ? (
              <p className="text-body-sm text-text-secondary">
                Add at least one more problem to compare.
              </p>
            ) : null}
          </div>
          <CompareGrid columns={columns} />
        </div>
      )}
    </div>
  );
}
