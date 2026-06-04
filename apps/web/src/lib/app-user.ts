import "server-only";

import { getUserByEmail, type User } from "@bristle/db";

// THE single demo-vs-session seam (slice 4.2). For v1.0 fixtures this resolves to
// the seeded demo user (Elena); at Tier 5.5 it flips — in ONE line — to the real
// session user. It answers WHICH user's data to render, NOT WHETHER the visitor is
// authenticated (the /app layout's auth() gate does that). The demo-email literal
// lives ONLY here, and every read helper takes the id this returns — so the swap
// is contained to this one function.
const DEMO_USER_EMAIL = "demo@bristle.dev";

export async function getAppUser(): Promise<User> {
  // Tier 5.5 swap (one line): resolve the authenticated session user instead, e.g.
  //   const session = await auth(); return getUserByEmail(session!.user.email);
  const user = await getUserByEmail(DEMO_USER_EMAIL);
  if (!user) {
    throw new Error(
      "demo user not seeded — run `pnpm --filter @bristle/db db:seed`",
    );
  }
  return user;
}
