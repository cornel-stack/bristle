import type { Problem } from "@bristle/db";
import { ProblemCardFull } from "@bristle/ui";
import Link from "next/link";

import { toProblemCardProps } from "../problem-card-adapter";

// Library card-grid view (the view-toggle alternate to the list/table). Reuses
// the canonical slice-4.2 ProblemCardFull via the shared toProblemCardProps
// adapter (forum badge included), each card wrapped in a link to the 4.3 detail.
// Same filtered/sorted `results` as the table.
export function ResultsGrid({ results }: { results: Problem[] }) {
  return (
    <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 xl:grid-cols-3">
      {results.map((p) => (
        <Link
          key={p.slug}
          href={`/app/problems/${p.slug}`}
          className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          <ProblemCardFull {...toProblemCardProps(p)} />
        </Link>
      ))}
    </div>
  );
}
