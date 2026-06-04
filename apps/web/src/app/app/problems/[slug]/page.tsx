// Authenticated Problem Detail — /app/problems/[slug]. Server Component rendered
// inside the gated app shell (app/app/layout.tsx runs the authoritative auth()
// check; the middleware /app/:path* matcher already covers this route — no
// middleware/auth change). Reads one problem's full detail from the slice-4.1
// fixtures (read-only); unknown slug → notFound(). `getAppUser()` is the seam
// resolving WHICH user's saved-state to show (the demo user for v1.0), never a
// hardcoded id. Next.js 15 async params: `params` is a Promise.

import { notFound } from "next/navigation";

import { getProblemActivity, getProblemDetail, getSavedProblemIds } from "@bristle/db";

import { ProblemDetail } from "@/components/app/problem-detail/problem-detail";
import { getAppUser } from "@/lib/app-user";
import { adaptProblemDetail } from "@/lib/problem-detail-adapter";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getProblemDetail(slug);
  if (!detail) notFound();

  const user = await getAppUser();
  const [savedIds, activity] = await Promise.all([
    getSavedProblemIds(user.id),
    getProblemActivity(detail.problem.id),
  ]);

  const vm = adaptProblemDetail(detail, savedIds.has(detail.problem.id));

  return <ProblemDetail vm={vm} activity={activity} />;
}
