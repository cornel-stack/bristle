# Quickstart / Verification: Slice 004

How to set up and verify once implemented. (No code yet — verification recipe the gate will follow.)

## Local setup
```bash
cp .env.example .env.local       # fill DATABASE_URL (pooler), DATABASE_URL_DIRECT (session/5432), SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
pnpm install
pnpm --filter @bristle/db db:migrate   # applies 0000 (CREATE EXTENSION vector + problems table) via DATABASE_URL_DIRECT
pnpm --filter @bristle/db db:seed       # idempotent upsert of the Stripe problem (via pooler)
pnpm --filter web dev                   # http://localhost:3000 → Stripe card from DB
```

## Acceptance checks (map to SC-001…SC-011)

- **SC-001 — .env**: `.env.example` documents `DATABASE_URL`, `DATABASE_URL_DIRECT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` with placeholders. `git ls-files | grep -E '^\.env'` → only `.env.example`.
- **SC-002 — schema**: `packages/db/src/schema.ts` defines `problems` per the contract.
- **SC-003 — migration committed**: `packages/db/drizzle/0000_*.sql` exists and is tracked by git.
- **SC-004 — migrate idempotent**: on a fresh DB, `db:migrate` creates the table; a second `db:migrate` reports nothing to apply.
- **SC-005 — seed idempotent**: `db:seed` then `db:seed` again → `SELECT count(*) FROM problems WHERE title='Stripe webhooks fail silently on Vercel cold starts'` returns 1.
- **SC-006 — server component**: `grep -rn "use client" apps/web/src/app` → no matches; `page.tsx` is `async` and imports `@bristle/db`.
- **SC-007 — local render parity**: `localhost:3000` shows the Stripe card with the same appearance as Slice 1.3 (pill, sparkline, quote box, badges, momentum), modulo relative time.
- **SC-008 — preview from prod DB**: with prod migrated + seeded and Vercel env set, the preview URL renders the card.
- **SC-009 — vector column**: `SELECT atttypid::regtype FROM pg_attribute WHERE attrelid='problems'::regclass AND attname='embedding'` → `vector`; `SELECT embedding FROM problems` → null for the seed row.
- **SC-010 — gates**: `pnpm typecheck && pnpm lint && pnpm --filter web build` all exit 0.
- **SC-011 — no env leak**: `git ls-files | grep -E '(^|/)\.env($|\.)'` returns only `.env.example`.

## Production
```bash
# Vercel dashboard: set the 4 vars for Preview + Production (user-owned)
DATABASE_URL_DIRECT=<prod session URL> pnpm --filter @bristle/db db:migrate
DATABASE_URL=<prod pooler URL> pnpm --filter @bristle/db db:seed
# push branch → Vercel preview renders the card from the prod DB
```

## Notes
- Migrations always use `DATABASE_URL_DIRECT` (session/5432); runtime + seed use `DATABASE_URL` (pooler/6543, `prepare:false`).
- A missing seed row makes `getFirstProblem()` throw (intentional — no empty state this slice).
