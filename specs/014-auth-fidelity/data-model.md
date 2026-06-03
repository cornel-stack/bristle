# Data Model: Auth Visual + Functional Fidelity (Slice 014)

Phase 1 schema artifact. This slice is **additive + one constraint relaxation** on the existing `users` table — no new tables. The other four slice-013 tables (`accounts`, `sessions`, `verificationTokens`, `password_reset_tokens`) are unchanged in shape; `accounts` simply starts being written by OAuth, and `verificationTokens` is retained but its rows may be dropped.

Migration file: **`packages/db/drizzle/0002_<name>.sql`** (generated via `drizzle-kit generate`; `0000`/`0001` already exist). Applied with the existing `pnpm --filter @bristle/db db:migrate` runner against `DATABASE_URL_DIRECT`.

---

## Naming convention

The existing `users` table uses **camelCase** for Auth.js-adapter-managed columns (`emailVerified`, `passwordHash`, `createdAt`, `updatedAt`) because the DrizzleAdapter expects those names verbatim. The five **new** columns are **Bristle-custom** (the adapter neither knows nor touches them), so they follow the **snake_case** convention already used by the Bristle-custom `password_reset_tokens` table and the OAuth token fields. This matches the names in the slice spec.

---

## `users` — five additive columns

| Column | Type (Drizzle) | Null | Default | Purpose |
|---|---|---|---|---|
| `email_verification_code` | `text` | nullable | — | argon2id hash of the current 6-digit code (R1). Null when no code is outstanding (incl. after success). |
| `email_verification_code_expires` | `timestamp({ withTimezone: true, mode: "date" })` | nullable | — | Code expiry = issue time + `CODE_TTL_MS` (10 min, C-e). Null when no code outstanding. |
| `email_verification_attempts` | `integer` | not null | `0` | Wrong-code attempt counter for the current code; reset to 0 on new code / success. Lockout at 5 (C-g). |
| `terms_accepted_at` | `timestamp({ withTimezone: true, mode: "date" })` | nullable | — | When the user accepted the Terms at signup (FR-008-area; SC-008). Null for pre-existing rows. |
| `terms_version` | `text` | nullable | — | Terms version string accepted (C-j). Null for pre-existing rows. |

**Drizzle (added inside the existing `users` `pgTable`)**:

```ts
emailVerificationCode: text("email_verification_code"),
emailVerificationCodeExpires: timestamp("email_verification_code_expires", {
  mode: "date",
  withTimezone: true,
}),
emailVerificationAttempts: integer("email_verification_attempts")
  .notNull()
  .default(0),
termsAcceptedAt: timestamp("terms_accepted_at", {
  mode: "date",
  withTimezone: true,
}),
termsVersion: text("terms_version"),
```

> TS property names are camelCase (Drizzle idiom); the **DB column names** are snake_case via the string arg. `email_verification_attempts` is `NOT NULL DEFAULT 0` so existing rows backfill to 0 cleanly and the increment logic never hits null.

---

## `users.passwordHash` — REQUIRED constraint relaxation (not in the original brief)

**Change**: `passwordHash` MUST become **nullable** (`ALTER COLUMN "passwordHash" DROP NOT NULL`).

**Why this is mandatory for OAuth**: Slice 013 declared `passwordHash text("passwordHash").notNull()` — correct for a credentials-only world. But when a user signs up via Google/GitHub, **Auth.js's DrizzleAdapter creates the `users` row with `{ name, email, image, emailVerified }` and no `passwordHash`** → a `NOT NULL` violation aborts the very first OAuth signup. OAuth users legitimately have no password. So the column must allow null.

**Drizzle**:
```ts
// was: passwordHash: text("passwordHash").notNull(),
passwordHash: text("passwordHash"),   // nullable — OAuth-created users have none
```

**Application impact (small, handled in Batch C/D)**: the credentials login path (`signInWithCredentials`) must treat a user with `passwordHash === null` as "no password set for this account" and return the **same generic** "invalid email or password" error (never a crash, never an enumeration signal) — an OAuth-only user simply can't sign in with a password. The argon2 `verifyPassword` wrapper is only called when a hash is present.

**This is a sixth statement in migration `0002` and a discovered necessary change beyond the brief's five columns. Flagged for founder awareness.**

---

## Migration `0002` — statement set + rollback

Forward (generated; order shown for clarity):

```sql
ALTER TABLE "users" ADD COLUMN "email_verification_code" text;
ALTER TABLE "users" ADD COLUMN "email_verification_code_expires" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "email_verification_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "terms_version" text;
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
```

Inline rollback (append as a `-- ROLLBACK` comment block at the migration tail, per slice-013 practice — forward-only in CI, manual on mid-slice failure):

```sql
-- ROLLBACK (manual; reverse order)
-- NOTE: re-adding NOT NULL to passwordHash will FAIL if any OAuth-only (null-hash)
-- users exist. Backfill or accept nullable before reverting that line.
-- ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;
-- ALTER TABLE "users" DROP COLUMN "terms_version";
-- ALTER TABLE "users" DROP COLUMN "terms_accepted_at";
-- ALTER TABLE "users" DROP COLUMN "email_verification_attempts";
-- ALTER TABLE "users" DROP COLUMN "email_verification_code_expires";
-- ALTER TABLE "users" DROP COLUMN "email_verification_code";
```

Optional data cleanup (separate, not in the migration): `DELETE FROM "verificationTokens";` — the retained-but-unused table (no production users depend on it). Keep the table for future Auth.js Email-provider compatibility.

---

## Tables unchanged (shape) this slice

- **`accounts`** — no DDL change. Already has all 11 Auth.js columns (`userId`, `type`, `provider`, `providerAccountId`, `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`) with the compound PK `(provider, providerAccountId)` and `onDelete: cascade` to `users`. OAuth sign-in writes one row here per linked provider (R3).
- **`sessions`** — no change. Receives rows from both the adapter (OAuth) and `createUserSession` (credentials); same cookie/token shape.
- **`verificationTokens`** — retained for Auth.js Email-provider future; rows may be dropped (above). No longer used by the registration flow.
- **`password_reset_tokens`** — no change; slice-013 reset semantics (single-use, 1-hour expiry, session invalidation) preserved.

---

## New / edited query helpers (`packages/db/src/queries.ts`)

Through Drizzle only (§3). Exact signatures finalized in implementation; intended surface:

- `setEmailVerificationCode({ userId, codeHash, expires })` — store hash+expiry, reset attempts to 0.
- `incrementEmailVerificationAttempts(userId): Promise<number>` — atomic `+1`, returns new count.
- `consumeEmailVerificationCode({ userId })` — atomic: set `emailVerified = now()`, null the code/expiry, zero attempts; the verify action calls this only after a successful argon2 verify. Returns the updated user (or a sentinel if already consumed) so the action is TOCTOU-safe.
- `deleteUnverifiedUserByEmail(email): Promise<boolean>` — delete a `users` row **only where `emailVerified IS NULL`** (the "use a different email" affordance, C-h). Returns whether a row was deleted; never deletes a verified user.

Re-export new helpers + any new inferred types from `packages/db/src/index.ts`.

---

## State transitions — email verification (per user)

```
[unverified, no code]
   └─ createAccount → setEmailVerificationCode(hash, now+10m, attempts=0)
[code outstanding]
   ├─ correct code (≤5 attempts, not expired) → consumeEmailVerificationCode → [verified]   → /login?verified=true + welcome email
   ├─ wrong code (attempts < 5)               → incrementEmailVerificationAttempts → [code outstanding]
   ├─ attempts == 5                            → locked → "request a new code"
   ├─ expires < now                            → "code expired, request a new code"
   ├─ resend (≥24s since last)                 → setEmailVerificationCode(new hash, now+10m, attempts=0)
   └─ use a different email                    → deleteUnverifiedUserByEmail → [gone] → /signup?email=…
[verified]  → terminal; code columns null
```

OAuth users are created with `emailVerified` set by the provider (Google/GitHub return verified emails), so they bypass this machine entirely — they never have a `passwordHash` or a verification code.
