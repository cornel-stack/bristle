import { desc, eq, ne } from "drizzle-orm";
import { getDb } from "./client";
import { problems, type Problem } from "./schema";

// Fetches the single problem for the homepage. Throws if none exists — a missing
// seed is a deployment defect, not a runtime empty state (Slice 1.4 non-goal).
export async function getFirstProblem(): Promise<Problem> {
  const [row] = await getDb().select().from(problems).limit(1);
  if (!row) throw new Error("No problem found — has the database been seeded?");
  return row;
}

// Fetches one problem by its stable slug. Throws if absent — same
// defect-not-empty-state semantics as getFirstProblem (used for the pinned hero).
export async function getProblemBySlug(slug: string): Promise<Problem> {
  const [row] = await getDb()
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  if (!row) throw new Error(`No problem found for slug "${slug}".`);
  return row;
}

// Fetches the most-recently-seen problems, optionally excluding one slug (used to
// keep the hero's pinned problem out of the sample row). Returns an empty array on
// an empty database — does NOT throw.
export async function getRecentProblems(opts: {
  limit: number;
  excludeSlug?: string;
}): Promise<Problem[]> {
  const { limit, excludeSlug } = opts;
  const base = getDb().select().from(problems);
  const filtered = excludeSlug
    ? base.where(ne(problems.slug, excludeSlug))
    : base;
  return filtered.orderBy(desc(problems.lastSeenAt)).limit(limit);
}
