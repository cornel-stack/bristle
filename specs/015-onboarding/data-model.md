# Data Model: Onboarding — Role + Categories (Slice 015)

Phase 1 schema artifact. **Additive only** — four nullable columns on the existing `users` table; no new tables, no constraint changes. Migration: **`packages/db/drizzle/0003_<name>.sql`** (`0000`–`0002` exist), applied with `pnpm --filter @bristle/db db:migrate` against `DATABASE_URL_DIRECT`.

---

## Naming convention

These four are **Bristle-custom** columns (not Auth.js-adapter-managed), so they follow the **snake_case** DB-name convention already used by the slice-014 custom columns (`email_verification_code`, `terms_accepted_at`, …). The Drizzle TS property names are camelCase.

---

## `users` — four additive columns

| Column (DB) | Drizzle | TS type | Null | Purpose |
|---|---|---|---|---|
| `role` | `text("role")` | `string \| null` | nullable | Chosen role slug ∈ the fixed set; null if skipped/incomplete. App-layer validated, NOT a DB enum (forward-flexible). |
| `role_custom` | `text("role_custom")` | `string \| null` | nullable | Free-text answer, set only when `role = 'other'`; ≤200 chars (app-enforced). |
| `watched_categories` | `text("watched_categories").array()` | `string[] \| null` | nullable | The **first `text[]` column**. 3–5 known category slugs when set; null if skipped/incomplete. (Empty array would mean "explicitly zero" — not reachable in normal flow.) |
| `onboarding_completed_at` | `timestamp(..., { mode: "date", withTimezone: true })` | `Date \| null` | nullable | null = onboarding not resolved; non-null = completed **or** skipped. The single "resolved" signal (no separate skipped flag). |

**Drizzle (added inside the existing `users` `pgTable`)**:
```ts
role: text("role"),
roleCustom: text("role_custom"),
watchedCategories: text("watched_categories").array(),
onboardingCompletedAt: timestamp("onboarding_completed_at", {
  mode: "date",
  withTimezone: true,
}),
```

**Allowed `role` values** (validated in the app, not the DB): `indie_founder` | `product_manager` | `agency_studio` | `innovation_lab` | `researcher` | `other`.

---

## Migration `0003` — statements + rollback

Forward (generated from the schema edit; order as drizzle-kit emits — independent ADD COLUMNs):
```sql
ALTER TABLE "users" ADD COLUMN "role" text;
ALTER TABLE "users" ADD COLUMN "role_custom" text;
ALTER TABLE "users" ADD COLUMN "watched_categories" text[];
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;
```

Inline rollback (append as a `-- ROLLBACK` comment block, reverse order, per slice-013/014 practice — forward-only in CI, manual on mid-slice failure):
```sql
-- ROLLBACK (manual; reverse order). All four are nullable + unconsumed by other
-- slices, so dropping them is safe (no backfill / no constraint to restore).
-- ALTER TABLE "users" DROP COLUMN "onboarding_completed_at";
-- ALTER TABLE "users" DROP COLUMN "watched_categories";
-- ALTER TABLE "users" DROP COLUMN "role_custom";
-- ALTER TABLE "users" DROP COLUMN "role";
```

> Unlike `0002` (which relaxed `passwordHash NOT NULL` and rippled into `signInWithCredentials`), `0003` is **purely additive + nullable** — no consuming code breaks, so no same-batch app-code forward-port is required. Existing `getUserByEmail` (a `select()`) returns the new columns automatically once the schema TS declares them.

---

## New / edited query helpers (`packages/db/src/queries.ts`)

Through Drizzle only (§3); exact signatures finalized in implementation:

- `saveUserRole({ userId, role, roleCustom })` — set `role` (+ `role_custom`, null unless `role = 'other'`), bump `updatedAt`. Does NOT set `onboarding_completed_at` (step 1 isn't completion).
- `saveUserCategories({ userId, categories })` — set `watched_categories` (a 3–5 validated slug array) **and** `onboarding_completed_at = now()` atomically (step 2 completes onboarding).
- `completeOnboarding(userId)` — set `onboarding_completed_at = now()` only (the "Skip for now" path; leaves role/categories untouched).

Re-export the helpers + any new inferred types from `packages/db/src/index.ts`. `getUserByEmail` is reused as-is for the page guards (it already returns the full row incl. the four new columns).

---

## State transitions — onboarding (per user)

```
[unresolved: onboarding_completed_at = null, role = null, watched_categories = null]
   │  (after first sign-in, /account guard) → /onboarding/role
   ├─ saveUserRole(role[, roleCustom])      → role set; → /onboarding/categories
   │     [partial: role set, completed_at still null]   (returning here resumes at categories)
   ├─ saveUserCategories(3–5 slugs)         → categories set + completed_at = now() → /account  [RESOLVED]
   └─ completeOnboarding() (Skip on either step) → completed_at = now(), role/categories left null → /account  [RESOLVED]
[resolved: onboarding_completed_at != null]
   │  /onboarding/* guard → /account  (re-edit deferred, TF-008)
   └─ terminal for this slice
```

OAuth users start in `[unresolved]` exactly like credentials users (the adapter creates the row with all four columns null), so they traverse the same machine on first sign-in.
