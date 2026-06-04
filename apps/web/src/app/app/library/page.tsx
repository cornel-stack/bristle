// Library faceted browse — /app/library. Server Component rendered inside the
// gated app shell (app/app/layout.tsx; the /app/:path* matcher already covers
// this route — no middleware/auth change). The Library is GLOBAL over the
// fixtures (all 15, all 8 categories, display-only) — NO getAppUser, no user
// scoping, nothing to flip at Tier 5.5. Reads searchParams → the read helper →
// the pure filter engine, all server-side. Next 15 async searchParams.
//
// Batch 0: minimal render (count + raw list) to prove the pipeline; Batch A
// replaces it with <LibraryView>.

import { getLibraryProblems } from "@bristle/db";

import { filterLibrary } from "@/lib/library-filter";
import { parseLibraryQuery } from "@/lib/library-params";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseLibraryQuery(await searchParams);
  const rows = await getLibraryProblems();
  const { results, total } = filterLibrary(rows, query);

  return (
    <div className="mx-auto max-w-6xl px-grid py-section">
      <h1 className="font-serif text-heading-h1 text-text-primary">Library</h1>
      <p className="mt-2 text-body-sm text-text-secondary">
        {total} results &middot; sorted by {query.sort}
      </p>
      <ul className="mt-grid space-y-snug">
        {results.map((p) => (
          <li key={p.slug} className="text-body-md text-text-primary">
            {p.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
