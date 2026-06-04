// Library faceted browse — /app/library. Server Component rendered inside the
// gated app shell (app/app/layout.tsx; the /app/:path* matcher already covers
// this route — no middleware/auth change). The Library is GLOBAL over the
// fixtures (all 15, all 8 categories, display-only) — NO getAppUser, no user
// scoping, nothing to flip at Tier 5.5. Reads searchParams → the read helper →
// the pure filter engine, all server-side. Next 15 async searchParams.
//
import { getLibraryProblems } from "@bristle/db";

import { LibraryView } from "@/components/app/library/library-view";
import { filterLibrary } from "@/lib/library-filter";
import { parseLibraryQuery } from "@/lib/library-params";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseLibraryQuery(await searchParams);
  const rows = await getLibraryProblems();
  const { results, facetCounts, total } = filterLibrary(rows, query);

  return (
    <LibraryView query={query} results={results} facetCounts={facetCounts} total={total} />
  );
}
