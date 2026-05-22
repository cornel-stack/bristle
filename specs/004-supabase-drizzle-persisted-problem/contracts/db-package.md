# Contract: `@bristle/db` public surface

Server-only package. MUST NOT be imported into a client component (carries the DB driver + reads connection secrets).

## Exports (from `@bristle/db`)

```ts
// schema
export { problems } from "./schema";
export type { Problem, NewProblem } from "./schema";

// client
export function getDb(): PostgresJsDatabase<typeof schema>;   // memoized; postgres-js { prepare: false }; throws if DATABASE_URL unset

// queries
export function getFirstProblem(): Promise<Problem>;          // throws if no row exists (no empty state this slice)
```

## Guarantees
- `getDb()` uses `DATABASE_URL` (Transaction pooler) with `{ prepare: false }`.
- `getFirstProblem()` returns the single seeded problem; **throws** when the table is empty (a missing seed is a deployment defect — Q5).
- Migrations are **not** part of the runtime export — they run via the `db:migrate` script against `DATABASE_URL_DIRECT`.

## Scripts (run via `pnpm --filter @bristle/db <script>`)
- `db:generate` — generate SQL migration from `schema.ts` into `./drizzle` (no DB connection).
- `db:migrate` — apply migrations against `DATABASE_URL_DIRECT` (session mode).
- `db:seed` — idempotently upsert the canonical problem (via the pooler).
- `db:studio` — drizzle-kit studio against `DATABASE_URL_DIRECT`.

## Consumption (apps/web, server only)
```ts
import { getFirstProblem } from "@bristle/db";   // in an async Server Component
```
