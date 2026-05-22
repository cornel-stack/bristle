import { getDb } from "./client";
import { problems, type Problem } from "./schema";

// Fetches the single problem for the homepage. Throws if none exists — a missing
// seed is a deployment defect, not a runtime empty state (Slice 1.4 non-goal).
export async function getFirstProblem(): Promise<Problem> {
  const [row] = await getDb().select().from(problems).limit(1);
  if (!row) throw new Error("No problem found — has the database been seeded?");
  return row;
}
