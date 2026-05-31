# Phase 1 Data Model: Production Authentication (Slice 013)

Five new tables in `packages/db`. Defined in `src/auth-schema.ts`, re-exported through `src/schema.ts` so `drizzle-kit` (which globs `./src/schema.ts`) and `@auth/drizzle-adapter` both resolve them. Column names/types match what the Drizzle adapter expects for the standard Auth.js tables (`users`, `accounts`, `sessions`, `verificationTokens`); `password_reset_tokens` is Bristle-custom.

Postgres extension: `gen_random_uuid()` (pgcrypto / built-in in PG13+) — already available on Supabase.

---

## Entity overview & relationships

```text
                         ┌─────────────────────┐
                         │       users         │
                         │ id (uuid, PK)        │
                         │ email (unique)       │
                         │ emailVerified (ts?)  │
                         │ passwordHash         │
                         └──────────┬──────────┘
            ┌───────────────┬───────┴────────────┬───────────────────────┐
            │ FK userId     │ FK userId          │ FK userId             │ (none — keyed by
            ▼ CASCADE       ▼ CASCADE            ▼ CASCADE               │  email identifier)
   ┌────────────────┐ ┌──────────────┐ ┌────────────────────────┐ ┌──────────────────────┐
   │   accounts     │ │   sessions   │ │ password_reset_tokens  │ │  verificationTokens   │
   │ (future OAuth) │ │ (db session) │ │ (custom, 1h, single-use)│ │ (24h email verify)    │
   └────────────────┘ └──────────────┘ └────────────────────────┘ └──────────────────────┘
```

- `accounts`, `sessions`, `password_reset_tokens` → `users.id` via `ON DELETE CASCADE` (deleting a user removes their linked rows).
- `verificationTokens` is **not** FK'd to users (Auth.js standard: it is keyed by an email `identifier`, since a token may be issued before/independent of a confirmed user row); rows are pruned on consumption/expiry.

---

## Table DDL (target — as the migration should generate)

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NULL |
| `email` | `text` | **UNIQUE**, NOT NULL |
| `emailVerified` | `timestamp` (mode date) | NULL until verified |
| `image` | `text` | NULL (future avatar) |
| `passwordHash` | `text` | NOT NULL |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

Indexes: unique on `email`.

### `accounts` (provisioned for future OAuth; unused by credentials flow)

> **Adapter-required shape (corrected at T007):** the Drizzle adapter's TS types require the Auth.js-canonical **compound primary key `(provider, providerAccountId)`** — no surrogate `id` column. The original `id uuid PK` + unique constraint was rejected by the adapter types.

| Column | Type | Constraints |
|---|---|---|
| `userId` | `uuid` | FK → `users.id` ON DELETE CASCADE, NOT NULL |
| `type` | `text` | NOT NULL |
| `provider` | `text` | NOT NULL |
| `providerAccountId` | `text` | NOT NULL |
| `refresh_token` | `text` | NULL |
| `access_token` | `text` | NULL |
| `expires_at` | `integer` | NULL |
| `token_type` | `text` | NULL |
| `scope` | `text` | NULL |
| `id_token` | `text` | NULL |
| `session_state` | `text` | NULL |

Primary key: **compound (`provider`, `providerAccountId`)** (adapter requirement). Snake_case token columns are the Auth.js standard names — keep them verbatim so the adapter maps OAuth responses without translation later.

### `sessions` (database session strategy)

> **Adapter-required shape (corrected at T007):** `sessionToken` **is the primary key** (the adapter looks up and deletes sessions by it) — no surrogate `id` column.

| Column | Type | Constraints |
|---|---|---|
| `sessionToken` | `text` | **PRIMARY KEY** |
| `userId` | `uuid` | FK → `users.id` ON DELETE CASCADE, NOT NULL |
| `expires` | `timestamp` (mode date) | NOT NULL |

Bulk-deleted by `userId` on password reset (FR-016).

### `verificationTokens` (Auth.js standard; 24h email verify)
| Column | Type | Constraints |
|---|---|---|
| `identifier` | `text` | NOT NULL (the email) |
| `token` | `text` | **UNIQUE**, NOT NULL |
| `expires` | `timestamp` (mode date) | NOT NULL |

Primary key: **composite (`identifier`, `token`)**. Consumed (deleted) on verify.

### `password_reset_tokens` (Bristle-custom; 1h, single-use)
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `userId` | `uuid` | FK → `users.id` ON DELETE CASCADE, NOT NULL |
| `token` | `text` | **UNIQUE**, NOT NULL |
| `expires` | `timestamp` (mode date) | NOT NULL |
| `used` | `boolean` | NOT NULL, default `false` |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |

Indexes: unique on `token`. `used` flipped to `true` atomically with the password update (TOCTOU-safe — see Validation rules).

---

## Validation rules (enforced in Zod + actions, not only DB)

- **email**: trimmed, lowercased, valid format; DB unique constraint is the final authority on duplicates (FR-008 returns a generic error on conflict).
- **password**: ≥ 12 chars, no other composition rules (NIST-style); confirm field must match (client + server).
- **verification token**: 32-byte base64url random; 24h `expires`; single-use (row deleted on consume).
- **reset token**: 32-byte base64url random; 1h `expires`; `used=false` at issue. **Consumption is atomic**: the reset completes in a transaction that (1) re-checks `used=false AND expires > now()`, (2) updates `users.passwordHash`, (3) sets `used=true`, (4) deletes all `sessions` for `userId`. Reuse after success fails step 1 → "no longer valid" (FR-016/FR-017, SC-007).
- **session**: 30-day `maxAge`; adapter checks `expires` on read.

---

## Inferred TypeScript types (exported from `packages/db`)

`auth-schema.ts` exports the Drizzle tables; `index.ts` re-exports both tables and `$inferSelect`/`$inferInsert` types, e.g. `User`/`NewUser`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`/`NewPasswordResetToken`, mirroring the existing `Problem`/`NewProblem` convention.

---

## Migration & rollback (`packages/db/drizzle/0001_<name>.sql`)

- Generated by `drizzle-kit generate`; forward-only; committed with the slice.
- Applied to the dev DB via `pnpm --filter @bristle/db db:migrate` (against `DATABASE_URL_DIRECT`).
- **Inline rollback** appended as a comment block at the file tail (run manually if a downstream task fails), `DROP TABLE` in reverse-FK order:

```sql
-- ROLLBACK (manual; run if a downstream slice-013 task fails)
-- DROP TABLE IF EXISTS "password_reset_tokens";
-- DROP TABLE IF EXISTS "sessions";
-- DROP TABLE IF EXISTS "accounts";
-- DROP TABLE IF EXISTS "verificationTokens";
-- DROP TABLE IF EXISTS "users";
-- (then: git revert the migration file + remove its entry from drizzle/meta/_journal.json)
```

**Verification at STOP 2**: confirm all 5 tables exist, FKs present (CASCADE), and the four unique indexes + composite PK exist (e.g. `\d+ users`, `\d+ password_reset_tokens` or a Drizzle Studio check). Production application is deferred (Risk R2).
