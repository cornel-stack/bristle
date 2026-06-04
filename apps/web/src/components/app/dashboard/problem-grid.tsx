import type { Problem } from "@bristle/db";
import { ProblemCardFull } from "@bristle/ui";
import Link from "next/link";

import { toProblemCardProps } from "../problem-card-adapter";

// The dashboard's six-card grid (server component, presentational). Receives the
// already-sorted top-six (the page sorts the full 15 then slices — never
// pre-truncated). Each canonical ProblemCardFull is wrapped in a slug link to the
// AUTHENTICATED detail (TF-021, slice 4.3) — not the public /problems/[slug].
export function ProblemGrid({ problems }: { problems: Problem[] }) {
  return (
    <div className="grid grid-cols-1 gap-grid md:grid-cols-2 xl:grid-cols-3">
      {problems.map((p) => (
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
