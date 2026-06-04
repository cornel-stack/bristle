# Implementation Plan: Problem Detail (Authenticated) — Slice 4.3

**Branch**: `018-problem-detail` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-problem-detail/spec.md`

> **DON'T-IMPLEMENT GUARD** — this is a design-artifact plan only (plan.md + research.md + data-model.md + contracts/ + quickstart.md). No application code, no `/speckit.tasks`, no `/speckit.implement`. Hold for founder review.

## Summary

Build the authenticated Problem Detail page at `/app/problems/[slug]` — the second Tier-4 screen — rendering everything `design/Core_app.pdf` page 2 shows for a single problem, inside the existing slice-4.2 app shell. The page is a **Server Component** that resolves the current user via the `getAppUser()` seam and reads one problem's full detail through the existing read-only `getProblemDetail(slug)` (which already returns all child sets). A **single small client island** holds the active-tab state for a true **ARIA tablist** (seven swapped panels, `?tab=` deep-linked, default Synthesis); the **right rail (donut / WTP / personas / related) is persistent**, rendered outside the tab swap. Presentational chart leaves from the slice-2.6 public sample report are **reused via a boundary adapter** (`getProblemDetail → leaf props`); source-key-bound leaves that cannot represent the DB shape are **wrapped as new in-app components — the shared public leaves are never mutated** (they still render the live public `/problems/[slug]`). One new read-only `packages/db` helper (`getSavedProblemIds`) lets the **Save** button reflect the demo user's pre-seeded saved state; Compare/Alert me/Export render visual-only. TF-021 is closed by re-pointing the dashboard card link to `/app/problems/[slug]`. No schema/seed/migration change.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Next.js 15 App Router, React 19; Node 24 runtime (Vercel).

**Primary Dependencies**: `next`, `react`, `@bristle/ui` (canonical ProblemCard + source-icons incl. `forum`), `@bristle/db` (Drizzle read helpers, `getProblemDetail`), `@bristle/shared` (`resolveBadge`, source registry, Zod contracts), `next-themes`, `lucide-react`. **No new dependency** (charts hand-rolled — CLAUDE.md §9.5).

**Storage**: Supabase Postgres (read-only this slice) via Drizzle. dev == prod single instance; reads only.

**Testing**: typecheck + lint + build gates (sandbox); Vitest/Playwright not added this slice. Interactive signed-in walk is founder-run on the Vercel preview.

**Target Platform**: Web (Vercel), Editorial Light + Dark, mobile-responsive.

**Project Type**: Turborepo monorepo — `apps/web` (Next.js) + `packages/{db,ui,shared}`.

**Performance Goals**: Server Components first; client JS budget < 180KB gzipped initial (CLAUDE.md §5); LCP < 2.5s mid-range/4G; Lighthouse 90+. Islands minimized to the tab-state island (+ the already-client `FrequencyChart`).

**Constraints**: Read-only diff (`apps/web` + ONE read-only `packages/db` helper); no schema/seed/migration; never mutate a shared public leaf; 5-source design-delta (no Product Hunt / Google Play); `?tab=` deep links; no `localStorage`/`sessionStorage`; tokens-only styling.

**Scale/Scope**: 15 seeded problems × 7 tabs + persistent rail; 1 new route, ~12–15 new in-app components, 1 boundary adapter, 1 read-only DB helper, 1 dashboard link edit.

## Constitution Check

*GATE: must pass before Phase 0; re-checked after Phase 1.*

| Constitution rule | Status | Note |
|---|---|---|
| §3 stack (Next 15 RSC-first, Tailwind v4 tokens, next-themes, lucide, Drizzle, TS strict) | ✅ | No new lib; RSC page + one client island; charts hand-rolled. |
| §4 design system (tokens, type scale, radii, motion, a11y) | ✅ | Tokens-only; reduced-motion honored; tablist a11y (roles, focus rings). |
| §5 conventions (kebab files, DB via Drizzle in packages/db, no localStorage, Zod shared) | ✅ | All reads via `@bristle/db` helpers; no client storage; saved-state is a read helper. |
| §6 voice (plain, no exclamation/emoji) | ✅ | Empty/zero states use the dry register ("No willingness-to-pay signal yet."). |
| §9.1 never modify `design/` | ✅ | Read-only reference. |
| §9.4 build exactly the slice | ✅ | Mutations deferred to 4.5/4.6/4.7/Tier 6; buttons render only. |
| §9.5 no new library without proposal | ✅ | Zero new deps; charts hand-rolled / reused SVG leaves. |
| §9.6 no localStorage/sessionStorage | ✅ | Tab state in URL `?tab=` + React state; no storage. |
| **A2 guard — never mutate a shared public leaf** | ✅ | Gaps resolved by wrapping (new in-app components), documented in research.md §3. |

**Result**: PASS. No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/018-problem-detail/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions, leaf inventory, gap resolutions
├── data-model.md        # Phase 1 — read sources + adapter mapping (read-only)
├── quickstart.md        # Phase 1 — batch walkthrough + verification split
├── contracts/
│   └── ui-and-data.md    # Phase 1 — adapter contract, tab keys, helper signature
└── tasks.md             # Phase 2 — /speckit.tasks (NOT created here)
```

### Source code (repository root) — this slice

```text
apps/web/src/
├── app/app/problems/[slug]/
│   └── page.tsx                      # NEW — RSC: getAppUser() → getProblemDetail(slug) → notFound() | <ProblemDetail/>
├── components/app/problem-detail/    # NEW — in-app detail surface (all kebab-case)
│   ├── problem-detail.tsx            # layout composer: header + tabs(island) + persistent rail
│   ├── detail-header.tsx             # breadcrumb, chips, demand-status chip, first-seen/updated, title, momentum chip, source-badge row, summary line
│   ├── detail-action-bar.tsx         # Save (reflects saved state) + Compare/Alert me/Export (visual-only)
│   ├── detail-tabs.tsx               # CLIENT ISLAND — ARIA tablist; active tab ↔ ?tab=; slots server-rendered panels
│   ├── panels/
│   │   ├── synthesis-panel.tsx       # NEW — synthesis prose
│   │   ├── frequency-panel.tsx       # REUSE FrequencyChart (+ threshold/caption wrap)
│   │   ├── evidence-panel.tsx        # NEW — filter chips + quote rows + show-more (wrap; EvidenceQuote gap)
│   │   ├── evidence-quote-row.tsx    # NEW — handle · engagement|rating · WTP chip · time; @bristle/ui source icon (forum-capable)
│   │   ├── solutions-panel.tsx       # NEW — existing-solution cards + match chips
│   │   ├── wtp-panel.tsx             # NEW — WTP summary + genuine-0 state (also used by rail)
│   │   ├── related-panel.tsx         # NEW — related list (app link target + label-only; wrap, RelatedProblemsCard gap)
│   │   └── activity-panel.tsx        # NEW — activity log rows
│   └── rail/
│       ├── detail-rail.tsx           # NEW — persistent rail composer
│       ├── sources-rail.tsx          # REUSE SourcesCard (DonutChart + legend) via adapter rows
│       ├── personas-rail.tsx         # NEW — who's-complaining bars
│       └── related-rail.tsx          # reuses related-panel's link rule (or shared related-list)
├── lib/
│   └── problem-detail-adapter.ts     # NEW — boundary adapter: ProblemDetail → reused-leaf props + in-app view models
└── components/app/dashboard/
    └── problem-grid.tsx              # EDIT (TF-021) — card link /problems/[slug] → /app/problems/[slug]

packages/db/src/
├── queries.ts                        # EDIT — add read-only getSavedProblemIds(userId)
└── index.ts                          # EDIT — export it

CLAUDE.md                             # EDIT — §8 doc-only note + SPECKIT plan pointer
```

**Structure Decision**: New `app/app/problems/[slug]` route under the existing gated `/app` group; all in-app detail components live under `components/app/problem-detail/**`; the boundary adapter lives at `apps/web/src/lib/problem-detail-adapter.ts` (web-side, so it can import both `@bristle/db` types and the public leaf prop types). Reused public leaves are imported **as-is** from `components/problem/*` — read, not edited.

## Architecture decisions (detail)

### Route + gating (FR-001/002/003)
`app/app/problems/[slug]/page.tsx` is an async Server Component. Next.js 15 async params: `params: Promise<{ slug: string }>`. It resolves the viewer via `getAppUser()` (the seam — demo user in v1.0; the one-line Tier-5.5 flip point), reads `getProblemDetail(slug)`; `undefined` → `notFound()`. It renders inside the existing `app/app/layout.tsx` shell, which already runs the authoritative `auth()` gate. **No middleware/auth change** — the `/app/:path*` matcher already covers `/app/problems/*` (confirmed in `apps/web/src/middleware.ts`). Anonymous request → existing redirect to `/login?callbackUrl=/app/problems/[slug]` (sandbox-verifiable over HTTP).

### Tab mechanic (A1 / FR-006/007)
A true ARIA tablist. `detail-tabs.tsx` is the **only new client island**: it owns `activeTab`, initialized from the `?tab=` searchParam (validated against the 7 keys; absent/unrecognized → `synthesis`), and updates the URL on change (history replace, no scroll jump) so tabs are deep-linkable and shareable. The seven server-rendered panels are passed in as children/slots and shown/hidden by the island (panels stay in the DOM for instant switching + SR completeness, or are conditionally rendered — pinned in contracts). Keyboard model: roving focus across `role="tab"`, arrow keys move, Enter/Space activate, `aria-selected` + `aria-controls`/`id` wiring, visible 2px focus ring. **Tab keys** (order): `synthesis · frequency · evidence · solutions · wtp · related · activity`. **Count-bearing labels**: `evidence` (quote count), `solutions` (solution count), `wtp` (mention count). The **right rail renders in the layout composer, outside the island**, so it persists across tab changes.

### Reuse vs wrap (A2) — see research.md §3 for the full inventory
- **Reused as-is via adapter** (source-key-agnostic): `DonutChart`, `SourcesCard`, `FrequencyChart`, `ProblemMomentumChip`, `donut-math`, `frequency-math`.
- **Wrapped (new in-app, public leaf NOT reused — real contract gap)**: `EvidenceQuote`/`EvidenceList` (no `forum` in `SampleProblemSourceKey`; engagement hardwired to upvotes/comments; no WTP chip; no filter chips; carries sample-only `blurred`) → `evidence-panel` + `evidence-quote-row`. `ProblemSourceBadge` (no `forum`) → header source-badge row uses `@bristle/ui` source-icons via `resolveBadge`. `RelatedProblemsCard` (hardcodes public `/problems/${slug}` link; requires slug+title+leadSnippet so cannot represent label-only DB rows) → in-app related list linking `/app/problems/[targetSlug]` or rendering label-only unlinked.
- **Verify-at-STOP-2**: `FrequencyChart` — confirm it renders the validation-threshold marker + "N mentions · +X% vs prior period" caption the design shows; if it lacks them, the app **wraps** it (overlay marker + caption around the reused chart) rather than editing the leaf.

### Source model (5-source delta, FR-015/016)
The adapter derives donut rows + evidence filter-chip counts from `problemSources`/`problemQuotes`, routing every `source_key` through `@bristle/shared resolveBadge` (single badge truth): `gh→GitHub`, `hn→Hacker News`, `so`+`se→Stack Overflow` (rolled to one badge, label per slice-4.2 D6), `appstore→App Store`, `forum→Forums`. Five live sources only — Product Hunt / Google Play are never produced even though the page-2 comp legend lists Product Hunt. Donut slices are per-source quote counts summing to the **quote** total; "N sources" in the header summary is the **distinct-source** count (the comp shows "47 quotes · 6 sources").

### Save state (A3 / FR-005)
New read-only helper `getSavedProblemIds(userId: string): Promise<Set<string>>` (or `isProblemSaved(userId, problemId)`), seam-parameterized — takes the `getAppUser()`-resolved id, never a hardcoded id. The page passes whether this problem's id is in the set to `detail-action-bar.tsx`; **Save** renders "Saved" vs "Save" accordingly. The click is **inert** this slice (toggle ships in 4.5). Compare/Alert me/Export render visual-only.

### Charts (FR-021) + reduced motion
Frequency chart + sources donut are the reused hand-rolled SVG leaves; the header momentum is `ProblemMomentumChip` (chip + delta). The page-2 header shows the chip/delta, not an inline sparkline — if a sparkline is wanted it reuses the dashboard `buildSparklinePath` pattern (decorative), pinned as optional in contracts. All transitions honor `prefers-reduced-motion`.

## Batching (STOP-gated; one commit per task; read-only slice)

- **Batch 0 → STOP 1 — Route + shell wiring + saved helper + TF-021.** `page.tsx` (RSC, getAppUser → getProblemDetail → notFound); `problem-detail.tsx` composer skeleton; `detail-header.tsx` + `detail-action-bar.tsx` (Save reflects state) reading raw detail (pre-adapter for static fields); `detail-tabs.tsx` tablist island with empty panel slots; `getSavedProblemIds` read helper + export; TF-021 dashboard link re-point. **Gate**: anonymous `/app/problems/[slug]` → 307 `/login` (HTTP); typecheck/lint/build; public `/problems/[slug]` untouched.
- **Batch A → STOP 2 — Boundary adapter + leaf reconciliation.** `problem-detail-adapter.ts`: `ProblemDetail → {donutRows, frequencyData, momentum, evidenceVMs, solutionVMs, wtpVM, personaVMs, relatedVMs, summaryCounts}`. Read each reused leaf, map or flag. **Surface the FrequencyChart threshold/caption verification result.** Foreground tsx probe: adapter maps the hero (Stripe) + a `forum`-source problem + the no-WTP problem (pgvector) + a label-only related entry. **Gate**: probe passes; typecheck/lint; A2 guard upheld (no public-leaf edit — `git diff --stat components/problem/` is empty).
- **Batch B → STOP 3 — Seven tab panels.** synthesis / frequency (reuse + wrap) / evidence (filter chips + quote rows + show-more) / solutions (match chips) / wtp (+ genuine-0) / related (app link + label-only) / activity. **Gate**: all 7 panels render for the hero from fixtures; `?tab=` deep links open each; typecheck/lint/build.
- **Batch C → STOP 4 — Persistent right rail.** sources-rail (reuse SourcesCard) / wtp-rail / personas-rail (bars) / related-rail; rail persists across tab switches; donut sums = quote total. **Gate**: rail renders on hero + pgvector (0-WTP rail state); typecheck/lint/build.
- **Batch D → STOP 5 — Polish + gates + preview.** Light/dark parity; mobile-responsive (header reflow, tab strip scroll/wrap, rail stacks under content); a11y (tablist roles, `aria-selected`/`aria-controls`, roving focus, focus rings, reduced-motion); CLAUDE.md §8 doc-only note + SPECKIT pointer; typecheck/lint/build 4/4; per-route First Load JS (islands = `detail-tabs` + the already-client `FrequencyChart`). Push → preview. **Gate**: founder-run preview checklist (below).

## Slice-integrity manifest

- **NEW**: `apps/web/src/app/app/problems/[slug]/page.tsx`; `apps/web/src/components/app/problem-detail/**`; `apps/web/src/lib/problem-detail-adapter.ts`; `packages/db` `getSavedProblemIds` (read-only).
- **EDIT**: `apps/web/src/components/app/dashboard/problem-grid.tsx` (TF-021 link target); `packages/db/src/queries.ts` + `index.ts` (export the helper); `CLAUDE.md` §8 doc-only note + SPECKIT plan pointer.
- **UNCHANGED**: Tier-3 auth + `middleware.ts`; the public `/problems/[slug]` route and **all** `components/problem/*` shared leaves (byte-for-byte); 4.1 schema/seed/migration; canonical `ProblemCardFull` logic; `getProblemDetail`.

## Reused-leaf inventory (read from source)

| Leaf (`components/problem/`) | Current prop contract | DB → props mapping | Absorbed by adapter? |
|---|---|---|---|
| `DonutChart` | `{rows:{name,count}[], total, ariaLabel}` | `problemSources` → `{name: resolveBadge label, count: quoteCount}`; total = Σ quoteCount | ✅ reuse (source-agnostic; forum → "Forums") |
| `SourcesCard` | `{rows:{name,count}[], total}` (wraps DonutChart + legend) | same rows + total | ✅ reuse for rail |
| `FrequencyChart` | `{data: Record<7d/30d/90d/all, {date,count}[]>}` (client) | bucket `problemFrequencyPoints` into 4 windows | ✅ reuse — **verify threshold marker + caption; wrap if absent** |
| `ProblemMomentumChip` | `{momentum:{delta,windowDays}}` | `{delta: format(momentumPct), windowDays: 14}` | ✅ reuse |
| `EvidenceQuote` / `EvidenceList` | quote `source: SampleProblemSourceKey` (no `forum`); `upvotes`+`commentCount`; `blurred`; no WTP; list has no filter chips | DB quote has `engagementValue/Label` OR `rating`, `isWtpSignal`/`statedPriceUsd`, `sourceKey` incl. `forum` | ❌ **GAP → wrap** (`evidence-panel` + `evidence-quote-row`; `@bristle/ui` forum-capable icons) |
| `ProblemSourceBadge` | `{source: SampleProblemSourceKey}` (no `forum`) | DB `source_key` incl. `forum` | ❌ **GAP → wrap** (header/rail use `@bristle/ui` source-icons via `resolveBadge`) |
| `RelatedProblemsCard` | `{items:{slug,title,leadSnippet}[]}`; hardcodes `/problems/${slug}` link; all fields mandatory | DB `problemRelated`: `{label, targetSlug|null, relatedProblemId}` (label-only = no slug) | ❌ **GAP → wrap** (in-app list: `/app/problems/[targetSlug]` or unlinked label-only) |

## Risks & follow-ups

- **Leaf-contract gaps (evidence, source-badge, related)** — resolved by **wrap** (new in-app components), public leaves untouched per A2. Re-confirmed at STOP-2 with an empty `git diff` over `components/problem/`.
- **FrequencyChart threshold/caption** — if the reused leaf lacks the validation-threshold marker / prior-period caption, wrap (overlay), don't mutate. Decided at STOP-2.
- **TF-022 (source-vocab reconciliation)** — the app evidence/source rendering routes through `@bristle/ui` source-icons (forum-capable) + `resolveBadge`; if this fully converges the card+detail source vocab, note TF-022 progress (don't broaden scope).
- **TF-024 (converge the wrapped leaves) — NEW, out of scope here.** Wrapping creates two parallel sets of some leaves (public vs authenticated). Correct now (safe; the authenticated Evidence genuinely needs more — `forum`, WTP chips, filters), but once the public surface is safe to change, converge `ProblemSourceBadge` / `RelatedProblemsCard` (and eventually `EvidenceQuote`/`EvidenceList`) onto **shared, source-agnostic, DB-shaped leaves**. Bundle with TF-022. Do not act this slice.
- **TF-025 (verify the public sample's data source) — NEW, out of scope here.** A2's read says `/problems/[slug]` renders from the hardcoded `SAMPLE_PROBLEMS` store, not the DB. If true, it **won't swap** when the app flips fixtures→live at Tier 5.5 — a latent surprise. Log to verify the slice-2.6 DoD intent (static vs DB-backed) before Tier 5.5. Do not act this slice.
- **`getAppUser()` seam** — remains the single Tier-5.5 flip point (which-user, not whether-authenticated); both new read helpers take the seam-resolved id.
- **dev == prod single Supabase** — reads only this slice; no writes, no migration.

## Process oddities (carry-forward)

- **Sandbox can't hold a signed-in session.** Sandbox-verifiable: anonymous `/app/problems/[slug]` → login redirect; `pnpm build`; data-layer tsx probe (adapter + helper over the seeded rows); the integrity diff. **Founder-run on preview** (real login): pixel fidelity vs page 2.
- **HTTPS-token push** for the preview branch (SSH agent refused): `git push "https://x-access-token:$(gh auth token)@github.com/cornel-stack/bristle.git" 018-problem-detail`.

### STOP-5 — check these against `design/Core_app.pdf` page 2 (founder, preview, light + dark + mobile)
1. Header: breadcrumb + Devtools/Payments chips + green "Validated demand" chip + "First seen … · Updated … ago" + title + ↑momentum + source-badge row + "N quotes · N sources · N willingness-to-pay mentions".
2. Action bar: Save (reflects saved state) / Compare / Alert me / Export (Export = bristle-accent primary).
3. Tab strip: seven tabs, Evidence/Solutions/WTP show counts, Synthesis default; swapped panels (not scroll); `?tab=evidence` deep-links.
4. Synthesis prose; Frequency chart (last-90-days, threshold marker, "+X% vs prior period", window toggles).
5. Evidence: filter chips (All/GH/HN/SO/Other) + quote rows (handle · engagement|rating · WTP chip · relative time · show-more).
6. Solutions: cards with Direct/Adjacent/Partial match chips.
7. Right rail persists across tabs: SOURCES donut (5 slices, sums to quotes) + legend; WTP panel; WHO'S COMPLAINING personas with bars; RELATED PROBLEMS.
8. Genuine-0: pgvector shows an explicit empty WTP (tab + rail); label-only related entries render unlinked; no dead links.
9. Keyboard: full tab reach + visible focus rings; reduced-motion respected; mobile reflow.

## Complexity Tracking

No constitution violations — section intentionally empty.
