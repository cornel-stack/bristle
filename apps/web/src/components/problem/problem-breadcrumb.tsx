// Presentational breadcrumb chain — literal " / " text separator, NO anchor
// tags (FR-006; the Library index + category routes don't exist in v1.0).
// When those routes land, swap the inner <span>s for <Link>s.
//
// The separator span carries aria-hidden="true" so screen readers don't read
// each " / " between labels; the <nav aria-label="Breadcrumb"> landmark + the
// label text alone gives SR users a clean reading.

import type { SampleProblemBreadcrumb } from "./types";

export function ProblemBreadcrumb({ breadcrumb }: { breadcrumb: SampleProblemBreadcrumb }) {
  return (
    <nav aria-label="Breadcrumb" className="py-snug">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-secondary">
        {breadcrumb.map((label, i) => (
          <li key={`${label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
