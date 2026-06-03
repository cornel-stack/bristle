// Server-side onboarding page guards (contracts §3). Each takes the loaded user
// and calls redirect() as a side effect when its condition holds — redirect()
// throws NEXT_REDIRECT, so these never return in the redirecting case and need no
// return value. The middleware (Batch C) only checks the session cookie at the
// edge (no DB there); completion-state routing is THIS layer's job, run inside the
// server components after auth(). Single source consumed by both /onboarding/*
// pages (T015/T016) and /account (T018).

import { redirect } from "next/navigation";

import type { User } from "@bristle/db";

// A completed user has no business on the onboarding steps → send them to the app.
export function requireOnboardingIncomplete(user: User): void {
  if (user.onboardingCompletedAt !== null) redirect("/account");
}

// An incomplete user reaching a post-onboarding surface (e.g. /account) is sent
// back to the first step.
export function requireOnboardingComplete(user: User): void {
  if (user.onboardingCompletedAt === null) redirect("/onboarding/role");
}

// Step 2 requires a role chosen in step 1; a user who skipped straight to
// /onboarding/categories without one is sent back to step 1.
export function requireRoleChosen(user: User): void {
  if (!user.role) redirect("/onboarding/role");
}
