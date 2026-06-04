// Saved Kanban board — /app/saved. Server Component inside the gated app shell
// (the /app/:path* matcher covers it — no middleware/auth change). Unlike the
// global Library, the Saved board IS user-scoped, so it resolves the getAppUser()
// seam (the Tier-5.5 flip makes it the real user). Reads the board + the saved
// usage meter (read-only) and hands them to the client board, which owns the
// ephemeral in-session state (slice 4.5, A1).

import { getSavedBoard, getUsageMeters } from "@bristle/db";

import { SavedBoard } from "@/components/app/saved/saved-board";
import { getAppUser } from "@/lib/app-user";

export default async function SavedPage() {
  const user = await getAppUser();
  const [columns, meters] = await Promise.all([
    getSavedBoard(user.id),
    getUsageMeters(user.id),
  ]);
  const saved = meters.find((m) => m.metric === "saved_problems");

  return (
    <SavedBoard
      initial={columns}
      savedUsed={saved?.used ?? 0}
      savedQuota={saved?.quota ?? null}
    />
  );
}
