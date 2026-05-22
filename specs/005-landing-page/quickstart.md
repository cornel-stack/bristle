# Quickstart / Verification: Slice 005

How to build and verify once implemented. (No code yet — the gate recipe.)

## Local
```bash
pnpm install
pnpm --filter @bristle/db db:seed     # upsert → exactly 4 rows (idempotent)
pnpm --filter web build && pnpm --filter web start   # / renders the landing
```
(Local dev reads the DB via the existing `apps/web/.env.local` symlink.)

## Acceptance checks (map to SC-001…SC-020)
- **SC-001 / SC-018** — visual: compare `/` vs `design/Public_pages.pdf` p.1 per section within 4px (local + Vercel preview).
- **SC-002** — responsive sweep at 320/375/768/1024/1280/1440: no horizontal scroll, overlap, or clipped text.
- **SC-003** — `apps/web/src/app/page.tsx` no longer the slice-004 single card.
- **SC-004** — hero uses `getProblemBySlug('stripe-webhooks-vercel-cold-starts')` (grep page.tsx; not `getFirstProblem`).
- **SC-005** — sample row = 3 `ProblemCardCompact` from one `getRecentProblems({limit:3,excludeSlug:'stripe-webhooks-vercel-cold-starts'})`; Stripe absent from the row.
- **SC-006** — `packages/ui/src/problem-card-compact.tsx` exists (own file); `grep -E "#[0-9A-Fa-f]{3,8}"` → none; no `Sparkline`/full-quote; padding < 24px.
- **SC-007** — `@bristle/db` exports `getProblemBySlug` + `getRecentProblems` + `getFirstProblem`.
- **SC-008 / SC-009** — `db:seed` twice → exactly 4 rows; categories payments/devtools/ai-ml/mobile; Stripe row verbatim.
- **SC-010** — `/pricing /about /blog /changelog /login /signup` each 200 + stub + `robots:noindex` (check meta).
- **SC-011** — footer newsletter input + button both `disabled`; "Email subscriptions launching soon" associated via `aria-describedby`.
- **SC-012** — footer contains literal "v0.2.0 · status: operational".
- **SC-013** — head has title + meta description + OG set; `https://bristle.vercel.app/og-image.png` resolves (1200×630 raster).
- **SC-014** — `pnpm typecheck && pnpm lint && pnpm --filter web build` exit 0.
- **SC-015** — Lighthouse on local prod build: Perf/A11y/Best-Practices/SEO each ≥90.
- **SC-016** — First-Load JS for `/` < 180 KB gz (build output).
- **SC-017** — Lighthouse mobile LCP < 2.5s.
- **SC-019** — grep landing source: zero `#hex`, zero hardcoded font-family strings.
- **SC-020** — grep landing copy: no `!`, no emoji, no "amazing"/"awesome".

## Production
- Vercel env already set (slice 004). Push branch → preview renders the landing from the prod DB; OG image resolves on the canonical origin.
- Re-seed prod if needed: `db:seed` against prod (4 rows).

## Notes
- `force-dynamic` on `/` (DB read at request time; no build-time prerender).
- `og-image.png` must be committed to `apps/web/public/` before the OG URL resolves.
