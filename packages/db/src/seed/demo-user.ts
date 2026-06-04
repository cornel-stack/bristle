import type { NewUser } from "../schema";

// The fixed demo user (slice 016 D5/A2). Deterministic id + reserved email so all
// user-scoped fixtures reference a stable owner, the seed is idempotent, and a real
// signup can't collide (the demo owns the unique email; passwordHash null = no
// credentials login). "Elena Hart" matches the design greeting.
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_USER_EMAIL = "demo@bristle.dev";

// Elena watches the 7 sidebar categories (Image 1 "across your 7 categories").
// Email/Comms is in the 8-key catalog + the Library, but NOT watched (catalog 8,
// demo watches 7).
export const DEMO_WATCHED_CATEGORIES = [
  "devtools",
  "payments",
  "ai-ml",
  "auth-sso",
  "deployment",
  "analytics",
  "mobile",
];

export const DEMO_USER: NewUser = {
  id: DEMO_USER_ID,
  email: DEMO_USER_EMAIL,
  name: "Elena Hart",
  emailVerified: new Date("2026-02-01T00:00:00Z"),
  passwordHash: null,
  role: "indie_founder",
  watchedCategories: DEMO_WATCHED_CATEGORIES,
  onboardingCompletedAt: new Date("2026-02-01T00:00:00Z"),
};
