# Tasks: Sample Report Detail Page

**Input**: `spec.md` + `plan.md` + `research.md` + `contracts/ui-and-data.md` + `quickstart.md` in `specs/012-sample-report/`
**Branch**: `012-sample-report`
**Tests**: none added this slice (no Vitest/Playwright wired; same as slices 005 / 006 / 008 / 009 / 010 / 011). Verification is the gate phase — typecheck/lint/build, First-Load JS budgets, **STOP-1 count cross-check** (slice-011 lesson — every count claim in spec/plan/tasks/data store must agree before any other batch starts), `[PLACEHOLDER]` header grep, hex/font/voice/emoji discipline greps, route 200 + meta-tag curl on all 5 prerendered slugs, 404 curl on unknown slug, **FrequencyChart toggle walk** (4 buttons, aria-pressed flips, SVG re-renders), **DonutChart segment count + per-segment `<title>` check**, **EvidenceList 8-element count** (5 unblurred + 2 blurred + 1 CTA), Save/Share presentational check (no `onClick`, no client state), breadcrumb plain-text " / " check (zero `<a>` tags), single-client-island check (exactly 1 `"use client"` under `apps/web/src/components/problem/`), responsive sweep at 320/375/768/1024/1280/1440, visual diff vs `design/Public_pages.pdf` page 7 at 1280 width, **link-flip regression** (3 slice-005 `SampleReports` landing card hrefs resolve to live stub pages with zero edits to `sample-reports.tsx`), additive-only diff check, slice-005/006/008/009/010/011 cross-slice regressions, and preview parity.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (visitor reads full Stripe sample report), US2 (visitor follows landing card or related-problems link to a stub report), US3 (404 case for unknown slug + integrity gates + perf/a11y/voice/responsive floors + link-flip + cross-slice regressions), or SETUP.
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: four batches, each ending in **one STOP** for review (per slice-006/008/009/010/011 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #10 (slice 011) merged to `main` via merge commit `1c26385` on 2026-05-27; `012-sample-report` cut from clean `main` (no stacking; local main already in sync with origin); branch starts at the spec commit `9a86554` and plan commit `7c97d62`. Slice-005 `sample-reports.tsx:28` already renders `href={`/problems/${problem.slug}`}` for the 3 DB-seeded slugs (LLM streaming / Expo OTA / pgvector); slice-005 `hero.tsx:37-47` renders `ProblemCardFull` with NO `href` (Stripe full page is direct-URL only — landing-hero wiring deferred per plan §13 tracked follow-up). Verified at plan time; **no edits to `sample-reports.tsx`, `hero.tsx`, `top-nav.tsx`, `site-footer.tsx`, or `app/layout.tsx` this slice**.
- **Additive-only, zero new deps**: no top-level dependency added (`DonutChart` and `FrequencyChart` are hand-rolled inline SVG; no `recharts`, no `chart.js`, no `d3`, no `framer-motion`). `pnpm-lock.yaml` MUST remain unchanged. **No edits to any slice-005 / slice-006 / slice-008 / slice-009 / slice-010 / slice-011 file**; **no edits under `packages/` or `design/`**. The 4th stub `webhook-ordering-on-retries` is slice-012-local and is NOT added to the slice-004 `packages/db/src/seed.ts`.
- **Boundary reminder**: `apps/web/src/app/problems/[slug]/page.tsx` (new) is an async Server Component with `generateStaticParams` + `generateMetadata` + `notFound()`; **exactly one** file under `apps/web/src/components/problem/` carries `"use client"` — `frequency-chart.tsx` (plan §2 / FR-008 / SC-017). Save/Share buttons in `ProblemHero` are presentational `<button type="button">` with no `onClick`, no client state, no persistence — preserves the single-client-island discipline.
- **Discriminated-union narrowing (HARD GATE)**: `SampleProblem = SampleProblemFull | SampleProblemStub` discriminated by `stubBody: boolean`. `ProblemBody` (T011) and `ProblemLayout` (T019) MUST branch on `if (problem.stubBody) { ... } else { ... }` and rely on TypeScript narrowing — **zero non-null assertions** (`!`) on full-report fields. If you find yourself reaching for `!`, the discriminator narrowing isn't being honored. Catches data-store authoring mistakes at compile time.
- **Architectural-first composition** (plan §8 + quickstart.md): `SampleBanner` (T005) sits OUTSIDE the standard `TopNav-Main-SiteFooter` shell — first sibling under the route root, ABOVE `TopNav`. This is the first time chrome renders above `TopNav` in the project. The composition order in `ProblemLayout` (T019) is `<SampleBanner /> + <TopNav /> + <main>...</main> + <SiteFooter />`. Documented in quickstart.md as the canonical pattern for future page-level full-bleed elements.
- **DonutChart palette** (plan §7 — Option A confirmed): largest segment by count = `fill-accent-bristle` (GitHub 26); remaining three by descending count = `fill-text-primary` (HN 13) / `fill-text-secondary` (SO 3) / `fill-text-tertiary` (Other 5). **Token-validation pre-flight already done**: `--color-text-tertiary` is defined at `apps/web/src/app/globals.css:24` (light `#9A9A93`, dark `#6B6B65`) — Tailwind v4 auto-generates `fill-text-tertiary` from this token. No fallback needed.
- **Blur magnitude** (plan §9 — `blur-sm` confirmed): Tailwind `blur-sm` utility (4px default) on the `<blockquote>` text only of the 2 blurred `EvidenceQuote` cards. Author row stays sharp. `select-none` on the blurred blockquote prevents copy-paste extraction.
- **Pull-quote near-duplicate** (plan §5): `ProblemPullQuote` (T010) is a page-local near-duplicate of slice-010 `InlinePullQuote` — visually and structurally identical (`<figure>` → `<blockquote>` accent bar + italic serif → optional `<cite>`), same prop shape `{quote: {text, attribution?}}`. **Do NOT import from `@/components/blog/inline-pull-quote`** — additive only; the `packages/ui/` extraction is a tracked follow-up.
- **Don't-implement guard**: tasks.md is generated only. Do NOT run `/speckit.implement` — hold for user review.

---

## Batch A — types + helpers + content data  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] `types.ts` (SampleProblem discriminated union + all sub-shapes)
Create `apps/web/src/components/problem/types.ts` exporting the canonical type module for the slice per plan §3 / contracts:

- `SampleProblemSourceKey` — string-literal union of 7 keys: `"github" | "hackernews" | "stackoverflow" | "reddit" | "producthunt" | "appstore" | "playstore"`.
- `SampleProblemMomentum` — `{ delta: string; windowDays: number }`. `delta` is pre-formatted, e.g. `"+312%"`.
- `SampleProblemSourceRow` — `{ name: string; count: number }`. Consumed by `SourcesCard` (T013) breakdown list AND `DonutChart` (T012) segments.
- `SampleProblemEvidenceQuote` — `{ authorHandle: string; source: SampleProblemSourceKey; upvotes: number; commentCount: number; timestamp: string; text: string; blurred: boolean }`. `timestamp` is pre-formatted compile-time string (no runtime `Intl`).
- `SampleProblemRelatedItem` — `{ slug: string; title: string; leadSnippet: string }`.
- `FrequencyWindow` — string-literal union: `"7d" | "30d" | "90d" | "all"`.
- `FrequencyPoint` — `{ date: string; count: number }`. `date` is ISO `yyyy-mm-dd`.
- `SampleProblemFrequencyData` — `Readonly<Record<FrequencyWindow, ReadonlyArray<FrequencyPoint>>>`. **The 4 windowed datasets are keyed at the type level** so `FrequencyChart` (T017) consumers can't read an unknown window without a compile error.
- `SampleProblemPullQuote` — `{ text: string; attribution?: string }`. Shape matches slice-010 `BlogPullQuote` verbatim so the page-local `ProblemPullQuote` (T010) is a true prop-and-visual near-duplicate.
- `SampleProblemBreadcrumb` — `ReadonlyArray<string>`. Typically 3-level: `["Library", "<Section>", "<Subsection>"]`.
- `SampleProblemBase` — interface carrying the 10 fields common to full + stub: `slug`, `breadcrumb`, `title`, `momentum`, `firstSeenDate` (ISO), `firstSeenDisplay` (e.g. `"Feb 8"`), `quoteCount`, `sourceCount`, `sourceBadges: ReadonlyArray<SampleProblemSourceKey>` (up to 5; no overflow indicator per spec FR-007), `lead`.
- `SampleProblemFull` — `extends SampleProblemBase` + `stubBody: false` + full-report fields: `pullQuote: SampleProblemPullQuote`, `body: string`, `sourcesBreakdown: ReadonlyArray<SampleProblemSourceRow>`, `frequencyData: SampleProblemFrequencyData`, `evidenceQuotes: ReadonlyArray<SampleProblemEvidenceQuote>`, `relatedProblems: ReadonlyArray<SampleProblemRelatedItem>`.
- `SampleProblemStub` — `extends SampleProblemBase` + `stubBody: true`.
- `SampleProblem` — discriminated-union type alias: `SampleProblemFull | SampleProblemStub`. TypeScript narrows on `if (problem.stubBody) { ... } else { ... }`.

- **Files**: `apps/web/src/components/problem/types.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file exports all named types (`grep -cE "export (interface|type) (SampleProblemSourceKey|SampleProblemMomentum|SampleProblemSourceRow|SampleProblemEvidenceQuote|SampleProblemRelatedItem|FrequencyWindow|FrequencyPoint|SampleProblemFrequencyData|SampleProblemPullQuote|SampleProblemBreadcrumb|SampleProblemBase|SampleProblemFull|SampleProblemStub|SampleProblem)" apps/web/src/components/problem/types.ts` returns `14`); discriminator pin (`grep -E "stubBody: (true|false)" apps/web/src/components/problem/types.ts` returns exactly 2 hits — one `false` on `SampleProblemFull`, one `true` on `SampleProblemStub`); `SampleProblemPullQuote` shape verified to match slice-010 `BlogPullQuote` (`diff <(grep -A 2 "interface BlogPullQuote" apps/web/src/components/blog/types.ts) <(grep -A 2 "interface SampleProblemPullQuote" apps/web/src/components/problem/types.ts)` should show only the type-name line differing).
- **Commit**: `feat(web): add problem/types.ts (SampleProblem discriminated union + sub-shapes) (slice 012)`

### T002 · [P] [US1] `donut-math.ts` (polarToCartesian + describeArc + buildDonutSegments helpers)
Create `apps/web/src/components/problem/donut-math.ts` exporting three pure functions per plan §7:

```ts
import type { SampleProblemSourceRow } from "./types";

// (cx, cy, r, angleDeg) → {x, y}. The -90 rotation makes 0° point North (12 o'clock).
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number };

// SVG path d-string for one donut-arc segment.
//   Start at outerR @ startAngle, sweep clockwise to outerR @ endAngle,
//   line inward to innerR @ endAngle, sweep counter-clockwise back to innerR @ startAngle, close.
export function describeArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string;

// Build segment array with cumulative angles. Returns Array<{name, count, pct, path}>.
export interface DonutSegment { name: string; count: number; pct: number; path: string; }
export interface BuildDonutSegmentsInput {
  rows: ReadonlyArray<SampleProblemSourceRow>;
  total: number;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
}
export function buildDonutSegments(input: BuildDonutSegmentsInput): ReadonlyArray<DonutSegment>;
```

Math correctness invariants per plan §7:
- `polarToCartesian` subtracts 90° from the input angle so 0° points North (segments start at 12 o'clock, sweep clockwise).
- `describeArc` sets the `largeArc` flag = 1 when `(endAngle - startAngle) > 180`, else 0.
- `buildDonutSegments` accumulates `share = row.count / total` × 360°; per-segment `pct = Math.round(share * 100)`. Pure function — does NOT sort the input rows (caller sorts before calling so the palette mapping in T012 hits the largest segment first).

- **Files**: `apps/web/src/components/problem/donut-math.ts`
- **Depends on**: T001 (imports `SampleProblemSourceRow`)
- **Verify**: `pnpm --filter web typecheck` exits 0; exports 3 named functions + 2 named interfaces (`grep -cE "^export (function|interface) (polarToCartesian|describeArc|buildDonutSegments|DonutSegment|BuildDonutSegmentsInput)" apps/web/src/components/problem/donut-math.ts` returns `5`); `polarToCartesian` body shows the `-90` rotation (`grep -E "angleDeg\s*-\s*90|\(angleDeg - 90\)" apps/web/src/components/problem/donut-math.ts` returns ≥ 1 hit); `describeArc` body shows the `largeArc` flag computation (`grep -c "largeArc" apps/web/src/components/problem/donut-math.ts` returns ≥ 1 hit). No imports from any chart library (`grep -E "^import .* from \"(d3|recharts|chart\\.js)" apps/web/src/components/problem/donut-math.ts` returns 0).
- **Commit**: `feat(web): add problem/donut-math.ts (polar-to-cartesian + describeArc + buildDonutSegments) (slice 012)`

### T003 · [P] [US1] `frequency-math.ts` (line-chart Y-axis scaling + X-tick positioning + SVG polyline path builder)
Create `apps/web/src/components/problem/frequency-math.ts` exporting pure helpers consumed by `FrequencyChart` (T017) per plan §6:

```ts
import type { FrequencyPoint } from "./types";

export interface AxisTick { x: number; label: string; }
export interface YTick { y: number; label: string; }
export interface FrequencyChartGeometry {
  pathD: string;                              // SVG <path d="..."> string for the polyline
  dots: ReadonlyArray<{ x: number; y: number }>;  // per-point dot positions
  xTicks: ReadonlyArray<AxisTick>;            // FEB 11 / MAR 13 / APR 12 / MAY 10 for the 90d window
  yTicks: ReadonlyArray<YTick>;               // optional grid-line labels
}

export function buildLinePath(points: ReadonlyArray<FrequencyPoint>): FrequencyChartGeometry;
```

Geometry pinning per plan §6:
- `viewBox = "0 0 1280 360"` (32:9 strip). Chart area: x ∈ [40, 1240] (40px padding L/R), y ∈ [20, 320] (20px padding top, 40px bottom for x-axis labels).
- Y-axis scaling: `yMax = max(point.count) * 1.10` (10% headroom); map `point.count` → `y = 320 - (point.count / yMax) * 300`.
- X-axis: linear evenly-spaced; `x = 40 + (idx / (points.length - 1)) * 1200`.
- X-tick labels: for windows >= 30 days, pick 4 evenly-spaced reference dates whose display labels match the design's `FEB 11 / MAR 13 / APR 12 / MAY 10` cadence. For 7d window, render 4 labels showing the actual date range.
- The `pathD` string starts with `M ${dots[0].x} ${dots[0].y}` and chains `L` segments through each subsequent dot. No smoothing curves — straight-line polyline (matches the design's chart shape).

- **Files**: `apps/web/src/components/problem/frequency-math.ts`
- **Depends on**: T001 (imports `FrequencyPoint`)
- **Verify**: `pnpm --filter web typecheck` exits 0; exports `buildLinePath` + the 4 named interfaces (`grep -cE "^export (function|interface) (buildLinePath|AxisTick|YTick|FrequencyChartGeometry)" apps/web/src/components/problem/frequency-math.ts` returns `4`); no imports from any chart library; `pathD` builder uses `M`/`L` SVG commands (no `C`/`Q`/`S` curve commands — `grep -E "[CQS] " apps/web/src/components/problem/frequency-math.ts` returns 0).
- **Commit**: `feat(web): add problem/frequency-math.ts (Y-axis scaling + X-ticks + polyline path builder) (slice 012)`

### T004 · [P] [US1] [US2] `sample-problems.ts` (SAMPLE_PROBLEMS — 5 entries verbatim with [PLACEHOLDER] header)
Create `apps/web/src/components/problem/sample-problems.ts` exporting `SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem>` containing exactly **5** entries (1 full + 4 stubs) per plan §4 / contracts. The file MUST begin with `// [PLACEHOLDER — sample problem content awaiting founder review before production launch]` on line 1 (FR-020).

**Entry 0 — STRIPE (full)**:
- `slug: "stripe-webhooks-vercel-cold-starts"` (matches slice-004 seed verbatim; reach: direct URL only — Hero card is not a link)
- `breadcrumb: ["Library", "Devtools", "Payments"]`
- `title: "Stripe webhooks fail silently on Vercel cold starts"` (matches slice-004 seed verbatim; **no trailing period**)
- `momentum: { delta: "+312%", windowDays: 14 }`
- `firstSeenDate: "2026-02-08"`, `firstSeenDisplay: "Feb 8"`
- `quoteCount: 47`, `sourceCount: 6`
- `sourceBadges: ["github", "hackernews", "stackoverflow", "reddit", "producthunt"]` (5 keys; 6th source is "Other" — counted in `sourceCount` but not badged)
- `lead`: "Across 47 mentions in the last 60 days, builders describe the same failure mode: a Stripe webhook arrives, the handler runs, the function is killed at the Vercel timeout (9.8s on hobby, 60s on Pro), and Stripe's retry policy compounds the problem into a cascading set of duplicate retries — or, more dangerously, a silent missed event when retries exhaust."
- `pullQuote: { text: "The handler ran fine in local. In production we lost $4,200 in failed retries before the dashboard reconciliation caught it.", attribution: "" }`
- `body`: "The problem is structural: serverless runtimes treat webhook handlers as ordinary HTTP requests, but Stripe's retry policy assumes a stateful long-lived endpoint. Three workarounds dominate the discussion — queue the event immediately and ack within 200ms (recommended by Stripe), use a stateful runtime (Workers, Fly), or move to a dedicated server. None are obvious for a beginner; all three require infrastructure decisions made before the first real customer."
- `sourcesBreakdown`: 4 rows summing to 47 — `[{name:"GitHub", count:26}, {name:"Hacker News", count:13}, {name:"Stack Overflow", count:3}, {name:"Other", count:5}]`
- `frequencyData`: 4 windowed datasets matching `FrequencyWindow` keys:
  - `"7d"` — 7 points from `2026-05-04` to `2026-05-10`, count values rising 8 → 12
  - `"30d"` — 30 points from `2026-04-11` to `2026-05-10`, count values rising 5 → 12
  - `"90d"` — 90 points from `2026-02-09` to `2026-05-10`, count values rising 1 → 12 (full +312% MoM shape)
  - `"all"` — 60 points from `2026-03-12` to `2026-05-10`, matching the design's `FREQUENCY · 60 DAYS` eyebrow; count values 3 → 12
- `evidenceQuotes`: **7 entries** — 5 `blurred:false` + 2 `blurred:true`. Each `{authorHandle, source, upvotes, commentCount, timestamp, text, blurred}`. Real placeholder text (NOT lorem-ipsum) on all 7 entries; the blur is a visual signal not a security measure. Voice §6 register on every quote.
- `relatedProblems`: **4 entries**, each `{slug, title, leadSnippet}` — slugs are exactly the 4 stub slugs below in this order: `webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`. The 1st item (`webhook-ordering-on-retries`) is topically coherent with the Stripe full problem; the other 3 are landing-flip stubs (documented placeholder shape per spec — founder reconciles for thematic coherence pre-launch).
- `stubBody: false`

**Entry 1 — WEBHOOK_ORDERING (stub, slice-012-local; NOT in slice-004 seed; reach: Stripe RelatedProblemsCard only)**:
- `slug: "webhook-ordering-on-retries"`, `breadcrumb: ["Library", "Devtools", "Payments"]`
- `title: "Webhook ordering on retries"` (matches design page 7's first related-problems item literally)
- `momentum: { delta: "+128%", windowDays: 14 }`, `firstSeenDate: "2026-03-04"`, `firstSeenDisplay: "Mar 4"`
- `quoteCount: 21`, `sourceCount: 3`, `sourceBadges: ["github", "hackernews", "stackoverflow"]`
- `lead`: "Two webhooks fire in close succession, the retry queue interleaves them, and the second one races the first. We've seen this break idempotency in two distinct ways."
- `stubBody: true`

**Entry 2 — LLM_STREAMING (stub, slice-004 seed-flip)**:
- `slug: "llm-streaming-cdn-buffering"` (slice-004 seed verbatim), `breadcrumb: ["Library", "AI/ML", "Streaming"]`
- `title: "LLM streaming chokes through CDN buffering"` (slice-004 seed verbatim)
- `momentum: { delta: "+184%", windowDays: 14 }`, `firstSeenDate: "2026-02-15"`, `firstSeenDisplay: "Feb 15"`
- `quoteCount: 34`, `sourceCount: 3`, `sourceBadges: ["hackernews", "stackoverflow", "github"]`
- `lead`: "Cloudflare buffers Server-Sent Events despite the explicit headers. Builders spend weeks diagnosing what looks like a backend stall but is actually edge-layer buffering."
- `stubBody: true`

**Entry 3 — EXPO_OTA (stub, slice-004 seed-flip)**:
- `slug: "expo-ota-ios-18-4"` (slice-004 seed verbatim), `breadcrumb: ["Library", "Mobile", "iOS"]`
- `title: "Expo OTA updates silently fail on iOS 18.4"` (slice-004 seed verbatim)
- `momentum: { delta: "+96%", windowDays: 14 }`, `firstSeenDate: "2026-04-02"`, `firstSeenDisplay: "Apr 2"`
- `quoteCount: 19`, `sourceCount: 3`, `sourceBadges: ["github", "appstore", "stackoverflow"]`
- `lead`: "Users on iOS 18.4 sit on the last shipped build. No error, no telemetry, no acknowledgement — and no fix in the Expo changelog yet."
- `stubBody: true`

**Entry 4 — PGVECTOR (stub, slice-004 seed-flip)**:
- `slug: "pgvector-index-degradation-2m"` (slice-004 seed verbatim), `breadcrumb: ["Library", "Devtools", "Databases"]`
- `title: "pgvector indexes degrade past 2M rows"` (slice-004 seed verbatim)
- `momentum: { delta: "+72%", windowDays: 14 }`, `firstSeenDate: "2026-03-21"`, `firstSeenDisplay: "Mar 21"`
- `quoteCount: 15`, `sourceCount: 3`, `sourceBadges: ["github", "hackernews", "stackoverflow"]`
- `lead`: "Hybrid-search query latency jumps from 80ms to 4.2s once embedding count crosses 2M. The HNSW index recall degrades and the standard fix recipes don't apply."
- `stubBody: true`

Final export: `export const SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem> = [STRIPE, WEBHOOK_ORDERING, LLM_STREAMING, EXPO_OTA, PGVECTOR];` — 5 entries in this order.

- **Files**: `apps/web/src/components/problem/sample-problems.ts`
- **Depends on**: T001 (imports `SampleProblem`, `SampleProblemFull`, `SampleProblemStub`)
- **Verify**: `pnpm --filter web typecheck` exits 0; `head -1 apps/web/src/components/problem/sample-problems.ts` returns the `[PLACEHOLDER]` header verbatim; voice grep on prose clean (no `!` outside JS-operator carve-out, no emoji, no `amazing`/`awesome`); the **STOP-1 count cross-check command** in `quickstart.md` returns the expected `5 / 1 / 4 / 4 / 4 / 4 / 2 / 5` distribution (see STOP 1 gate below — this is the slice-011 STOP-1 count-drift lesson applied).
- **Commit**: `feat(web): add problem/sample-problems.ts (5 entries — 1 full + 4 stubs; [PLACEHOLDER] header) (slice 012)`

**▸ STOP 1** — foundations ready: types compile with discriminator narrowing; donut + frequency math helpers in place; 5-entry data store in place with `[PLACEHOLDER]` header. Verification per T001-T004 Verify lines.

**STOP 1 count cross-check command** (slice-011 count-drift lesson — paste into terminal and verify counts):

```sh
echo "=== SAMPLE_PROBLEMS structural ==="
echo "  entries:                 $(grep -cE '^const [A-Z_]+: SampleProblem' apps/web/src/components/problem/sample-problems.ts)"
echo "  stubBody: false:         $(grep -c 'stubBody: false' apps/web/src/components/problem/sample-problems.ts)"
echo "  stubBody: true:          $(grep -c 'stubBody: true'  apps/web/src/components/problem/sample-problems.ts)"
echo "  relatedProblems items:   $(grep -A 4 'relatedProblems:' apps/web/src/components/problem/sample-problems.ts | grep -c '^\s*{ slug:')"
echo "  frequencyData windows:   $(grep -E '\"(7d|30d|90d|all)\":' apps/web/src/components/problem/sample-problems.ts | wc -l)"
echo "  sourcesBreakdown rows:   $(grep -A 5 'sourcesBreakdown:' apps/web/src/components/problem/sample-problems.ts | grep -c 'name:')"
echo "  blurred quotes (true):   $(grep -c 'blurred: true'  apps/web/src/components/problem/sample-problems.ts)"
echo "  blurred quotes (false):  $(grep -c 'blurred: false' apps/web/src/components/problem/sample-problems.ts)"
```

**Expected output**: `5 / 1 / 4 / 4 / 4 / 4 / 2 / 5`. If any count drifts, FIX `sample-problems.ts` before starting Batch B — every Batch B/C/D component reads from this data store.

**Additional STOP 1 sanity**:
- `pnpm --filter web typecheck && pnpm --filter web lint` exits 0 against the 4 new foundation files.
- Discriminator narrowing sanity: write a 5-line throwaway snippet `const p = SAMPLE_PROBLEMS[0]; if (!p.stubBody) { p.body; }` (don't commit) — typecheck passes; replacing `if (!p.stubBody)` with `if (p.stubBody)` makes the `.body` access fail to compile. Confirms TypeScript narrows correctly on the `stubBody` discriminator.
- Slug cross-check vs slice-004 seed: the 3 seed-flip slugs match `packages/db/src/seed.ts` verbatim — `diff <(grep -oE "stripe-webhooks-vercel-cold-starts|llm-streaming-cdn-buffering|expo-ota-ios-18-4|pgvector-index-degradation-2m" apps/web/src/components/problem/sample-problems.ts | sort -u) <(grep -oE "stripe-webhooks-vercel-cold-starts|llm-streaming-cdn-buffering|expo-ota-ios-18-4|pgvector-index-degradation-2m" packages/db/src/seed.ts | sort -u)` returns empty (the 4 shared slugs are identical between the two files; the slice-012-local `webhook-ordering-on-retries` is NOT in the diff because it's not in the slice-004 seed).

---

## Batch B — page-local primitive components  ▸ STOP 2

### Phase 3: User Story 1 (full Stripe report primitives) + User Story 2 (stub primitives)

### T005 · [P] [US1] [US2] `SampleBanner` (server) — orange strip above TopNav
Create `apps/web/src/components/problem/sample-banner.tsx` — server component per plan §8.
- `<div className="bg-accent-bristle text-surface-card">` outermost (full-bleed orange strip).
- Inner `<div className="mx-auto flex max-w-6xl items-center justify-between gap-grid px-grid py-snug">` for content alignment.
- `<p className="text-body-sm">You're viewing a free sample — see the full library of 142k+ problems.</p>` (em-dash, no exclamation).
- `<Link href="/signup" className="rounded-button bg-surface-card px-snug py-1 text-body-sm font-medium text-accent-bristle">Start free →</Link>` (rightarrow `→` character, not `<svg>` glyph).
- Tokens-only. Zero hex literals. Zero font-family strings.
- **Files**: `apps/web/src/components/problem/sample-banner.tsx`
- **Depends on**: — (no Batch A dep; no `SampleProblem` consumption)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; visible copy contains the exact string `You're viewing a free sample — see the full library of 142k+ problems.` and `Start free →`; CTA href is `/signup`; no hex literals (`grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/components/problem/sample-banner.tsx` returns 0).
- **Commit**: `feat(web): add problem/sample-banner.tsx (orange strip above TopNav with /signup CTA) (slice 012)`

### T006 · [P] [US1] [US2] `ProblemBreadcrumb` (server) — plain-text " / "-separated chain
Create `apps/web/src/components/problem/problem-breadcrumb.tsx` — server component per plan §12.
- Receives `{ breadcrumb: SampleProblemBreadcrumb }` (e.g. `["Library", "Devtools", "Payments"]`).
- Renders `<nav aria-label="Breadcrumb">` wrapping an `<ol>` of `<li>` items.
- Between each adjacent pair of items, render a literal `" / "` text span (`<span aria-hidden="true"> / </span>` so screen readers don't read each separator).
- Each item rendered as `<li><span className="text-body-sm text-text-secondary">{label}</span></li>` — **NO `<a>` tags this slice** (FR-006 — Library + category routes don't exist yet).
- **Files**: `apps/web/src/components/problem/problem-breadcrumb.tsx`
- **Depends on**: T001 (imports `SampleProblemBreadcrumb`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; the rendered HTML contains zero `<a` substrings within the breadcrumb (`grep -c "<a" apps/web/src/components/problem/problem-breadcrumb.tsx` returns 0); the separator is the literal `" / "` text (not a `<svg>`, not a `›` glyph); `<nav aria-label="Breadcrumb">` wraps the chain.
- **Commit**: `feat(web): add problem/problem-breadcrumb.tsx (text-only " / "-separated chain, no anchors) (slice 012)`

### T007 · [P] [US1] `ProblemMomentumChip` (server) — "▲ +312% / 14d" pill
Create `apps/web/src/components/problem/problem-momentum-chip.tsx` — server component per plan §4 / contracts.
- Receives `{ momentum: SampleProblemMomentum }`.
- Renders `<span className="inline-flex items-center gap-1 rounded-pill bg-accent-bristle px-2 py-0.5 text-body-sm font-medium text-surface-card">▲ {momentum.delta} / {momentum.windowDays}d</span>`.
- Token-driven (`bg-accent-bristle text-surface-card rounded-pill px-2 py-0.5 text-body-sm font-medium` — mirror of slice-011 `ChangelogBadge` "feature" recipe).
- ▲ character is the visible affordance (no extra `aria-label`).
- **Files**: `apps/web/src/components/problem/problem-momentum-chip.tsx`
- **Depends on**: T001 (imports `SampleProblemMomentum`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; tokens-only; the rendered chip includes the ▲ character + the formatted `delta / windowDays`d string.
- **Commit**: `feat(web): add problem/problem-momentum-chip.tsx (▲ +N% / Nd pill, tokens-only) (slice 012)`

### T008 · [P] [US1] [US2] `ProblemSourceBadge` (server) — circular per-source glyph
Create `apps/web/src/components/problem/problem-source-badge.tsx` — server component per plan §12.
- Receives `{ source: SampleProblemSourceKey }`.
- Renders a small circular badge with the source's initial letter (e.g. `G` for GitHub, `H` for Hacker News, `S` for Stack Overflow, `R` for Reddit, `P` for Product Hunt, `A` for App Store, `G` for Play Store — disambiguate Play Store via separate styling or a "P" / "G" tradeoff; recommend `G` for GitHub, `H` for Hacker News, `S` for Stack Overflow, `R` for Reddit, `P` for Product Hunt, `A` for Apple App Store, `g` lowercase for Google Play to disambiguate).
- Wrapper: `<span className="inline-flex size-6 items-center justify-center rounded-pill bg-surface-raised text-body-sm font-medium text-text-primary" aria-label="{Display name}">{initial}</span>`. Tokens-only.
- A `SOURCE_LABEL` const inside the file maps `SampleProblemSourceKey` → display name (`{"github": "GitHub", "hackernews": "Hacker News", ...}`) for the `aria-label`.
- **Files**: `apps/web/src/components/problem/problem-source-badge.tsx`
- **Depends on**: T001 (imports `SampleProblemSourceKey`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; each badge carries an `aria-label` with the source's display name (so screen readers hear "GitHub" not just "G"); `SOURCE_LABEL` const exists with 7 entries (one per `SampleProblemSourceKey` value).
- **Commit**: `feat(web): add problem/problem-source-badge.tsx (circular per-source glyph with aria-label) (slice 012)`

### T009 · [US1] [US2] `ProblemHero` (server — serif h1 + meta row 1 + meta row 2 with Save/Share)
Create `apps/web/src/components/problem/problem-hero.tsx` — server component per plan §1 / §12.
- Receives `{ problem: SampleProblem }`.
- `<section className="py-section">` outer wrapper.
- `<h1 className="font-serif text-h1 text-text-primary">{problem.title}</h1>`.
- Meta row 1 (`<div className="mt-grid flex flex-wrap items-center gap-grid text-body-sm text-text-secondary">`):
  - `<ProblemMomentumChip momentum={problem.momentum} />` (composes T007).
  - Source badges row: `<div className="flex -space-x-1">{problem.sourceBadges.map((s) => <ProblemSourceBadge source={s} />)}</div>` (overlapping circles via negative spacing).
  - `<span>First seen {problem.firstSeenDisplay}</span>`
  - `<span>·</span>`
  - `<span>{problem.quoteCount} quotes</span>`
  - `<span>·</span>`
  - `<span>{problem.sourceCount} sources</span>`
- Meta row 2 (`<div className="mt-snug flex items-center justify-end gap-snug">`):
  - `<button type="button" className="rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary">Save</button>` (no `onClick`, no client state — presentational only).
  - `<button type="button" className="rounded-button border border-border-default px-snug py-1 text-body-sm font-medium text-text-secondary">Share</button>` (same).
- Tokens-only. Zero hex literals.
- **Files**: `apps/web/src/components/problem/problem-hero.tsx`
- **Depends on**: T001 (imports `SampleProblem`) + T007 (`ProblemMomentumChip`) + T008 (`ProblemSourceBadge`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; the Save and Share `<button>` elements have NO `onClick` attribute (`grep -E "onClick=" apps/web/src/components/problem/problem-hero.tsx` returns 0) and are typed `type="button"`; the h1 uses `font-serif`; the meta row composes T007 + T008 correctly.
- **Commit**: `feat(web): add problem/problem-hero.tsx (h1 + meta rows + presentational Save/Share) (slice 012)`

### T010 · [P] [US1] `ProblemPullQuote` (server — page-local near-duplicate of slice-010 InlinePullQuote)
Create `apps/web/src/components/problem/problem-pull-quote.tsx` — server component per plan §5.
- Receives `{ quote: SampleProblemPullQuote }`.
- Renders verbatim shape from slice-010 `InlinePullQuote`:

```tsx
<figure className="my-loose">
  <blockquote className="border-l-2 border-accent-bristle pl-grid font-serif italic text-h3 text-text-primary">
    {quote.text}
  </blockquote>
  {quote.attribution && (
    <cite className="mt-snug block pl-grid text-body-sm not-italic text-text-secondary">
      {quote.attribution}
    </cite>
  )}
</figure>
```

- **DO NOT** import from `@/components/blog/inline-pull-quote` — additive only (FR-027; cross-page imports forbidden per slice-integrity discipline).
- The shape is intentionally a near-duplicate. The `packages/ui/` extraction is a tracked follow-up (plan §13).
- **Files**: `apps/web/src/components/problem/problem-pull-quote.tsx`
- **Depends on**: T001 (imports `SampleProblemPullQuote`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; **zero imports from `@/components/blog/`** (`grep -E "from \"@/components/blog/" apps/web/src/components/problem/problem-pull-quote.tsx` returns 0); JSX shape matches slice-010 `InlinePullQuote` (`diff <(sed -n '/return/,/^}/p' apps/web/src/components/blog/inline-pull-quote.tsx) <(sed -n '/return/,/^}/p' apps/web/src/components/problem/problem-pull-quote.tsx)` shows zero substantive differences — only the JSX bodies match, the type import line legitimately differs).
- **Commit**: `feat(web): add problem/problem-pull-quote.tsx (page-local near-duplicate of slice-010 InlinePullQuote) (slice 012)`

### T011 · [US1] [US2] `ProblemBody` (server — lead + ProblemPullQuote + body; branches on stubBody)
Create `apps/web/src/components/problem/problem-body.tsx` — server component per plan §1.
- Receives `{ problem: SampleProblem }`.
- **MUST branch on `if (problem.stubBody) { ... } else { ... }`** — TypeScript narrowing, zero non-null assertions on full-report fields.
- Stub branch: returns `<p className="my-section text-body-md text-text-secondary">Full problem report forthcoming.</p>` (matches slice-010 `BlogPostBody` stub literal verbatim).
- Full branch: renders `<div className="space-y-grid"><p className="font-serif text-body-lg text-text-primary">{problem.lead}</p><ProblemPullQuote quote={problem.pullQuote} /><p className="text-body-md text-text-primary">{problem.body}</p></div>`.
- **Files**: `apps/web/src/components/problem/problem-body.tsx`
- **Depends on**: T001 (imports `SampleProblem`) + T010 (`ProblemPullQuote`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; the branching uses `if (problem.stubBody)` (TypeScript narrowing) NOT `problem.pullQuote!` non-null assertion (`grep -E "!\\.|\\!\$|problem\\.[a-z]+!" apps/web/src/components/problem/problem-body.tsx` returns 0 hits on full-report fields); the stub branch renders the literal "Full problem report forthcoming." string.
- **Commit**: `feat(web): add problem/problem-body.tsx (lead + pull-quote + body; branches on stubBody) (slice 012)`

### T012 · [P] [US1] `DonutChart` (server — hand-rolled SVG, 4 segments via donut-math)
Create `apps/web/src/components/problem/donut-chart.tsx` — server component per plan §7.
- Receives `{ rows: ReadonlyArray<SampleProblemSourceRow>; total: number; ariaLabel: string }`.
- Token palette (Option A — RESOLVED): `SEGMENT_FILL_CLASS = ["fill-accent-bristle", "fill-text-primary", "fill-text-secondary", "fill-text-tertiary"] as const` — applied in descending-count order.
- Sort rows desc by count before passing to `buildDonutSegments` from T002 (the palette mapping then hits the largest segment first).
- Use `cx=120, cy=120, outerRadius=110, innerRadius=72` (72/110 ≈ 0.654 — matches the ~0.65 ratio per spec).
- Render `<svg viewBox="0 0 240 240" role="img" aria-label={ariaLabel} className="block h-auto w-full">{segments.map((seg, i) => <path key={seg.name} d={seg.path} className={SEGMENT_FILL_CLASS[i] ?? "fill-text-tertiary"}><title>{seg.name}: {seg.count} quotes ({seg.pct}%)</title></path>)}</svg>`.
- Per-segment `<title>` is both a native browser tooltip AND the SVG path's accessible name.
- **Files**: `apps/web/src/components/problem/donut-chart.tsx`
- **Depends on**: T001 (imports `SampleProblemSourceRow`) + T002 (imports `buildDonutSegments`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; `SEGMENT_FILL_CLASS` has exactly 4 entries (`grep -c "fill-" apps/web/src/components/problem/donut-chart.tsx` returns ≥ 4); per-segment `<title>` element present in the JSX (`grep -c "<title>" apps/web/src/components/problem/donut-chart.tsx` returns ≥ 1); `role="img"` + `aria-label` present on the `<svg>`; zero hex literals; the `fill-text-tertiary` utility validates at build (Tailwind generates it from the `--color-text-tertiary` token at `globals.css:24`).
- **Commit**: `feat(web): add problem/donut-chart.tsx (hand-rolled SVG, 4 segments, brand+monochrome palette) (slice 012)`

### T013 · [US1] `SourcesCard` (server — eyebrow + DonutChart + breakdown list)
Create `apps/web/src/components/problem/sources-card.tsx` — server component per plan §1.
- Receives `{ problem: SampleProblemFull }` (only relevant on full pages).
- `<section className="rounded-card border border-border-default bg-surface-card p-grid">` outer.
- `<p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">SOURCES · {problem.quoteCount} QUOTES</p>` (eyebrow uses the `quoteCount` field).
- `<DonutChart rows={problem.sourcesBreakdown} total={problem.quoteCount} ariaLabel={...descriptive aria-label...} />` (composes T012).
- Breakdown `<ul className="mt-grid space-y-snug">` with one `<li className="flex justify-between text-body-sm">` per row showing `<span>{name}</span><span className="font-mono text-text-secondary">{count}</span>`.
- Tokens-only.
- **Files**: `apps/web/src/components/problem/sources-card.tsx`
- **Depends on**: T001 (imports `SampleProblemFull`) + T012 (`DonutChart`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; eyebrow text includes `SOURCES ·` + the dynamic `quoteCount`; breakdown list renders `<li>` per `sourcesBreakdown` row.
- **Commit**: `feat(web): add problem/sources-card.tsx (eyebrow + DonutChart + breakdown list) (slice 012)`

### T014 · [P] [US1] `RelatedProblemsCard` (server — 4-item list of stub slugs)
Create `apps/web/src/components/problem/related-problems-card.tsx` — server component per plan §1.
- Receives `{ items: ReadonlyArray<SampleProblemRelatedItem> }`.
- `<section className="rounded-card border border-border-default bg-surface-card p-grid">` outer.
- `<h3 className="font-serif text-h4 text-text-primary">Related problems</h3>`.
- `<ul className="mt-grid space-y-grid">` with one `<li>` per item; each `<li>` renders `<Link href={`/problems/${item.slug}`} className="block">`-wrapped content showing `<p className="text-body-md font-medium text-text-primary">{item.title}</p><p className="mt-snug text-body-sm text-text-secondary">{item.leadSnippet}</p>`.
- Tokens-only. 4 `<a>` tags total when rendered with the Stripe `relatedProblems` array (length 4).
- **Files**: `apps/web/src/components/problem/related-problems-card.tsx`
- **Depends on**: T001 (imports `SampleProblemRelatedItem`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; each rendered item is wrapped in `<Link href="/problems/${slug}">`; 4-item rendering verifiable in the Stripe layout once T020 lands.
- **Commit**: `feat(web): add problem/related-problems-card.tsx (4-item linked list to /problems/{slug}) (slice 012)`

### T015 · [P] [US1] `EvidenceQuote` (server — single quote card with blurred prop)
Create `apps/web/src/components/problem/evidence-quote.tsx` — server component per plan §9.
- Receives `{ quote: SampleProblemEvidenceQuote }`.
- Card wrapper: `<article className="rounded-card border border-border-default bg-surface-card p-grid" aria-label={quote.blurred ? "Locked preview — sign up to read" : undefined}>`.
- Header row (`<header className="flex items-center gap-snug text-body-sm text-text-secondary">`): authorHandle (font-medium text-text-primary) + " · " + source display name + " · " + `{upvotes} upvotes · {commentCount} comments` + right-aligned timestamp. A `SOURCE_LABEL` const inside the file (or imported from a shared spot if extracted) maps `SampleProblemSourceKey` → display string.
- Quote body: `<blockquote className={`mt-grid font-serif text-body-lg italic text-text-primary ${quote.blurred ? "blur-sm select-none" : ""}`} aria-hidden={quote.blurred ? true : undefined}>{quote.text}</blockquote>`.
- The blur is the Tailwind `blur-sm` utility (4px); applied to the blockquote **text only**; the header row stays sharp.
- **Files**: `apps/web/src/components/problem/evidence-quote.tsx`
- **Depends on**: T001 (imports `SampleProblemEvidenceQuote`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; the `blur-sm` Tailwind utility is applied conditionally on `quote.blurred`; `aria-hidden` is conditionally `true` on the blurred blockquote; the wrapping `<article>` carries `aria-label` only when blurred (`grep -c 'aria-label.*Locked preview' apps/web/src/components/problem/evidence-quote.tsx` returns ≥ 1).
- **Commit**: `feat(web): add problem/evidence-quote.tsx (single quote card with blurred prop → blur-sm + aria-hidden) (slice 012)`

### T016 · [P] [US1] `EvidenceCTA` (server — gated sign-up callout)
Create `apps/web/src/components/problem/evidence-cta.tsx` — server component per plan §1.
- No props.
- `<aside className="rounded-card border border-accent-bristle bg-surface-raised p-grid text-center">` outer (accent-bristle border to signal "gated" affordance).
- `<p className="font-serif text-h3 text-text-primary">Sign up to see all 47 quotes</p>` (the `47` is the load-bearing fact; if a future slice generalizes this card across problems, swap to a `quoteCount` prop).
- `<p className="mt-snug text-body-sm text-text-secondary">Free, no credit card · See 6 existing solutions and 4 willingness-to-pay mentions</p>`.
- `<Link href="/signup" className="mt-grid inline-block rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card">Create free account →</Link>` (CTA links to `/signup` — slice-005 known carry-forward soft-404).
- Tokens-only. Voice §6 compliant (no exclamations).
- **Files**: `apps/web/src/components/problem/evidence-cta.tsx`
- **Depends on**: — (no Batch A or other dep)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; CTA href is `/signup`; visible copy matches the spec verbatim including the interpunct-separated subline.
- **Commit**: `feat(web): add problem/evidence-cta.tsx (gated sign-up callout linking to /signup) (slice 012)`

### T017 · [P] [US1] `FrequencyChart` (CLIENT — time-range toggle + hand-rolled SVG line chart)
Create `apps/web/src/components/problem/frequency-chart.tsx` — **CLIENT COMPONENT** per plan §2 / §6. The **only** file under `apps/web/src/components/problem/` carrying `"use client"`.
- Opens with `"use client";` directive.
- Receives `{ data: SampleProblemFrequencyData }`.
- `useState<FrequencyWindow>("90d")` initial — 90d window active on first paint.
- `<figure className="rounded-card border border-border-default bg-surface-card p-grid">` outer.
- Header (`<header className="mb-grid flex items-baseline justify-between gap-grid">`):
  - Left: eyebrow `<p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">FREQUENCY · 60 DAYS</p>` + headline `<h2 className="mt-snug font-serif text-h2 text-text-primary">47 mentions · +312% MoM</h2>`.
  - Right: `<div role="group" aria-label="Time range" className="flex gap-2">` containing 4 `<button type="button" aria-pressed={activeWindow === w}>` for windows `"7d" / "30d" / "90d" / "all"`. Active button = `bg-text-primary text-surface-card`; inactive = `border border-border-default text-text-secondary`.
- SVG: `<svg viewBox="0 0 1280 360" role="img" aria-label={`Frequency chart for the ${activeWindow} window`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">` — render x-tick `<text>` labels at y=340 (font-mono text-body-sm fill-text-secondary), the polyline as `<path d={pathD} className="fill-none stroke-accent-bristle" strokeWidth="2" />`, and per-point `<circle cx={d.x} cy={d.y} r="3" className="fill-accent-bristle" />` dots.
- Calls `buildLinePath(data[activeWindow])` from T003 to get `{pathD, dots, xTicks, yTicks}`.
- Reduced-motion: `matchMedia("(prefers-reduced-motion: reduce)").matches` fresh-read pattern sketched (currently a no-op since the re-render is instant; placeholder for future cross-fade polish).
- Tokens-only.
- **Files**: `apps/web/src/components/problem/frequency-chart.tsx`
- **Depends on**: T001 (imports `FrequencyWindow`, `SampleProblemFrequencyData`) + T003 (imports `buildLinePath`)
- **Verify**: `pnpm --filter web typecheck` exits 0; **this file is the ONLY one under `apps/web/src/components/problem/` carrying `"use client"`** — verifiable via `grep -l '"use client"' apps/web/src/components/problem/` returning exactly `apps/web/src/components/problem/frequency-chart.tsx`; the toggle button group uses `role="group"` + `aria-pressed` (Pattern A ARIA per FR-022); SVG has `role="img"` + `aria-label`; no `recharts`/`chart.js`/`d3` imports.
- **Commit**: `feat(web): add problem/frequency-chart.tsx (client; 4-window toggle + hand-rolled SVG line chart) (slice 012)`

**▸ STOP 2** — primitive components done: 13 components typecheck in isolation (12 server + 1 client). `FrequencyChart` is the only client component in Batch B. STOP 2 gate verifications:

- `pnpm --filter web typecheck && pnpm --filter web lint` exits 0.
- **Single-client-island check**: `grep -l '"use client"' apps/web/src/components/problem/` returns exactly `apps/web/src/components/problem/frequency-chart.tsx` and nothing else.
- **Discipline greps across all 13 new Batch B files**:
  - `grep -rEn "#[0-9a-fA-F]{3,8}" apps/web/src/components/problem/` returns 0 (zero hex literals).
  - `grep -rEn "font-family" apps/web/src/components/problem/` returns 0 (zero font-family strings).
  - `grep -rEn '!' apps/web/src/components/problem/ | grep -vE '!==?|!\w|aria-|onClick|\.|;'` returns 0 (zero exclamations in user-visible copy; JS-operator carve-out applies).
  - `grep -rPn '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' apps/web/src/components/problem/` returns 0 (zero emoji).
  - `grep -rEni "amazing|awesome" apps/web/src/components/problem/` returns 0 (zero hype).
- **Discriminator narrowing sanity** (T011 `ProblemBody`): `grep -nE "problem\\.(pullQuote|body|sourcesBreakdown|frequencyData|evidenceQuotes|relatedProblems)!" apps/web/src/components/problem/problem-body.tsx` returns 0 — zero non-null assertions on full-report fields.
- **Token-validation re-affirmed**: `fill-text-tertiary` consumed by T012 `DonutChart` validates against the `--color-text-tertiary` token at `globals.css:24` (Tailwind v4 auto-generates the utility — no fallback needed).

---

## Batch C — EvidenceList + ProblemLayout + route  ▸ STOP 3

### Phase 4: User Story 1 (full Stripe report assembly) + US2 (stub assembly) + US3 (route + 404 + link flip)

### T018 · [US1] `EvidenceList` (server — composes 5 visible + 2 blurred EvidenceQuote + 1 EvidenceCTA = 8 elements)
Create `apps/web/src/components/problem/evidence-list.tsx` — server component per plan §9.
- Receives `{ quotes: ReadonlyArray<SampleProblemEvidenceQuote> }`.
- `<section className="space-y-grid">` outer.
- `<h2 className="font-serif text-h2 text-text-primary">Evidence ({problem.quoteCount} quotes)</h2>` — note the h2 text consumes the dynamic quote count if a `quoteCount` prop is added; for v1.0 the heading reads `Evidence (47 quotes)` literally per the Stripe full record. Recommend either: (a) accept the literal `47` for v1.0 since only the Stripe full record renders EvidenceList; OR (b) accept a `headingCount: number` prop and pass `quoteCount` from `ProblemLayout`. Option (b) is one-line cleaner and future-proof; recommend (b).
- `<ul className="space-y-grid">{quotes.map((q, i) => <li key={i}><EvidenceQuote quote={q} /></li>)}</ul>`.
- `<EvidenceCTA />` appended after the `<ul>`.
- Rendering `quotes` of length 7 (5 unblurred + 2 blurred) PLUS the appended EvidenceCTA produces **8 card-like elements** total (SC-008).
- **Files**: `apps/web/src/components/problem/evidence-list.tsx`
- **Depends on**: T001 (imports `SampleProblemEvidenceQuote`) + T015 (`EvidenceQuote`) + T016 (`EvidenceCTA`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; once T020 lands, render the Stripe route and confirm the evidence section contains exactly 8 card-like top-level elements (5 unblurred + 2 blurred `<article>` + 1 `<aside>` CTA — verifiable via `curl -s <local>/problems/stripe-webhooks-vercel-cold-starts | grep -cE '<article|<aside class="rounded-card border border-accent-bristle'` returning the expected count once the page is wired).
- **Commit**: `feat(web): add problem/evidence-list.tsx (composes 5 + 2 EvidenceQuote + 1 EvidenceCTA = 8 elements) (slice 012)`

### T019 · [US1] [US2] [US3] `ProblemLayout` (server — composes SampleBanner ABOVE TopNav; branches on stubBody)
Create `apps/web/src/components/problem/problem-layout.tsx` — server component per plan §1 / §8.
- Receives `{ problem: SampleProblem }`.
- **MUST compose the architectural-first SampleBanner-above-TopNav shape** (plan §8 + quickstart.md):

```tsx
<>
  <SampleBanner />          {/* first sibling — ABOVE TopNav */}
  <TopNav />                {/* slice-005 reuse */}
  <main className="mx-auto max-w-6xl px-grid">
    <ProblemBreadcrumb breadcrumb={problem.breadcrumb} />
    <ProblemHero problem={problem} />
    {problem.stubBody ? (
      <p className="my-section text-body-md text-text-secondary">
        Full problem report forthcoming.
      </p>
    ) : (
      <>
        <section className="grid gap-grid py-section md:grid-cols-3">
          <div className="md:col-span-2"><ProblemBody problem={problem} /></div>
          <aside className="md:sticky md:top-grid md:flex md:flex-col md:gap-grid">
            <SourcesCard problem={problem} />
            <RelatedProblemsCard items={problem.relatedProblems} />
          </aside>
        </section>
        <section className="py-section">
          <FrequencyChart data={problem.frequencyData} />
        </section>
        <section className="py-section">
          <EvidenceList quotes={problem.evidenceQuotes} />
        </section>
      </>
    )}
  </main>
  <SiteFooter />             {/* slice-005 reuse */}
</>
```

- **MUST use TypeScript narrowing on `problem.stubBody`** — the `{problem.stubBody ? <stub-branch /> : <full-branch />}` ternary narrows so the full branch can read `problem.body`, `problem.frequencyData`, `problem.evidenceQuotes`, etc. without non-null assertions.
- Imports: `TopNav` from `@/components/landing/top-nav`, `SiteFooter` from `@/components/landing/site-footer`, the 11 page-local components from `./*`.
- **Files**: `apps/web/src/components/problem/problem-layout.tsx`
- **Depends on**: T001 (`SampleProblem`) + T005 (`SampleBanner`) + T006 (`ProblemBreadcrumb`) + T009 (`ProblemHero`) + T011 (`ProblemBody`) + T013 (`SourcesCard`) + T014 (`RelatedProblemsCard`) + T017 (`FrequencyChart`) + T018 (`EvidenceList`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file does NOT carry `"use client"`; the JSX shows `<SampleBanner />` BEFORE `<TopNav />` in the render tree (`grep -nE "<SampleBanner|<TopNav" apps/web/src/components/problem/problem-layout.tsx | awk '{print NR}'` shows SampleBanner on a lower line number than TopNav); zero non-null assertions on full-report fields (`grep -nE "problem\\.(pullQuote|body|sourcesBreakdown|frequencyData|evidenceQuotes|relatedProblems)!" apps/web/src/components/problem/problem-layout.tsx` returns 0).
- **Commit**: `feat(web): add problem/problem-layout.tsx (SampleBanner-above-TopNav shell; branches on stubBody) (slice 012)`

### T020 · [US1] [US2] [US3] `/problems/[slug]/page.tsx` (ADD — dynamic route with generateStaticParams + generateMetadata + notFound)
Create `apps/web/src/app/problems/[slug]/page.tsx` — async Server Component per plan §1 / §10.

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { SAMPLE_PROBLEMS } from "@/components/problem/sample-problems";
import { ProblemLayout } from "@/components/problem/problem-layout";

export async function generateStaticParams() {
  return SAMPLE_PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};
  const title = `${problem.title} — Bristle`;
  const description = problem.stubBody
    ? "Sample problem report — full report forthcoming."
    : problem.lead.length > 155
        ? problem.lead.slice(0, 152).replace(/\s+\S*$/, "") + "…"
        : problem.lead;
  const url = `${SITE_URL}/problems/${problem.slug}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function ProblemDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) notFound();
  return <ProblemLayout problem={problem} />;
}
```

- `generateStaticParams` returns exactly 5 entries (one per `SAMPLE_PROBLEMS` slug).
- `generateMetadata` truncates the lead at ~152 chars + " …" for the description; stubs use the fixed string.
- Unknown slugs → `notFound()` → HTTP 404 (slice-010 `/blog/[slug]` pattern).
- **Files**: `apps/web/src/app/problems/[slug]/page.tsx`
- **Depends on**: T004 (`SAMPLE_PROBLEMS`) + T019 (`ProblemLayout`)
- **Verify**: `pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build` all exit 0; build output shows 5 `● (SSG)` entries under `/problems/[slug]` (one per slug); `pnpm --filter web start` then `curl -sI http://localhost:3000/problems/stripe-webhooks-vercel-cold-starts` returns HTTP 200; `curl -sI http://localhost:3000/problems/this-does-not-exist` returns HTTP 404.
- **Commit**: `feat(web): add /problems/[slug]/page.tsx (5 SSG routes; generateMetadata; notFound) (slice 012)`

**▸ STOP 3** — Layout assembled; route wired. The 5 prerendered slugs now live. The 3 slice-005 `SampleReports` landing card hrefs (LLM streaming / Expo OTA / pgvector) now resolve to live HTTP 200 stub pages **with zero edits to `apps/web/src/components/landing/sample-reports.tsx`**. STOP 3 gate verifications:

- `pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build` exit 0.
- Build output confirms 5 `/problems/[slug]` routes are prerendered as `● (SSG)` and First Load JS per route is < 180 KB gz (target ~110-115 KB on Stripe, ~108-110 KB on stubs).
- `pnpm --filter web start &` then curl each of the 5 slugs + 1 unknown:

```sh
for slug in stripe-webhooks-vercel-cold-starts \
            webhook-ordering-on-retries \
            llm-streaming-cdn-buffering \
            expo-ota-ios-18-4 \
            pgvector-index-degradation-2m; do
  echo "$slug → $(curl -sI http://localhost:3000/problems/$slug | head -1)"
done
echo "unknown-slug → $(curl -sI http://localhost:3000/problems/this-does-not-exist | head -1)"
```

Expected: 5 × `HTTP/1.1 200 OK` + `HTTP/1.1 404 Not Found`.
- Link-flip pre-check: `curl -s http://localhost:3000/ | grep -oE 'href="/problems/[^"]+"' | sort -u` returns the 3 distinct stub hrefs (LLM streaming / Expo OTA / pgvector).

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 3 (perf / a11y / SEO / voice / responsive floors + slice integrity + link-flip)

### T021 · [US3] VERIFY — local gate
Run the local loop + audits against the post-implementation state.
- **Depends on**: T020
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-014)*
  - **All 5 routes + 404**: per the STOP 3 loop — 5 × `200` + 1 × `404`. *(SC-002, SC-013)*
  - **5 SSG prerenders**: build output marks `/problems/[slug]` with 5 `● Static` entries. *(SC-003)*
  - **Per-page metadata** (SC-004): for each of the 5 routes, `curl -s <local>/problems/<slug> | grep -oE '<title>[^<]+</title>|og:(title|description|url|image|type)'` shows: title `{problem.title} — Bristle`; all 5 OG tags; `og:type="article"`; absolute `og:url` containing the slug; absolute OG image at `<SITE_URL>/og-image.png`.
  - **First Load JS budget** (SC-014 / FR-022): all 5 `/problems/[slug]` routes < 180 KB gz per build report. Expected: ~112-115 KB on the Stripe full route, ~108-110 KB on each of the 4 stub routes. If any route ≥ 130 KB, investigate accidental bundle leak (chart library, slice-006/009/010/011 rail import, accidental client-component conversion of DonutChart/SourcesCard/etc.).
  - **Lighthouse on local prod for `/problems/stripe-webhooks-vercel-cold-starts`** (SC-015): Performance / Accessibility / Best Practices / SEO each ≥ 90.
  - **Single-client-island check** (SC-017): `grep -l '"use client"' apps/web/src/components/problem/ apps/web/src/app/problems/` returns **exactly one** file: `apps/web/src/components/problem/frequency-chart.tsx`.
  - **Save / Share presentational check** (SC-011): `grep -nE 'onClick' apps/web/src/components/problem/problem-hero.tsx` returns 0; the Save and Share buttons render as `<button type="button">` with no client state and no `onClick`.
  - **Breadcrumb plain-text " / "** (SC-012): `grep -nE "<a " apps/web/src/components/problem/problem-breadcrumb.tsx` returns 0 (zero anchor tags in the breadcrumb component); rendered HTML at `<local>/problems/stripe-webhooks-vercel-cold-starts` contains the literal `"Library / Devtools / Payments"` chain within the `<nav aria-label="Breadcrumb">` (verifiable via `curl -s <local>/problems/stripe-webhooks-vercel-cold-starts | grep -oE 'aria-label="Breadcrumb"[^<]*(?:<[^>]+>[^<]*)*Library[^<]+Devtools[^<]+Payments'` returning ≥ 1 hit).
  - **DonutChart structural check** (SC-007): `curl -s <local>/problems/stripe-webhooks-vercel-cold-starts | grep -oE '<path d="[^"]+"[^>]*>(<title>[^<]+</title>)?</path>'` returns 4 `<path>` elements within the donut SVG, each carrying a `<title>` child; `aria-label` on the `<svg role="img">` describes the breakdown.
  - **EvidenceList 8-element count** (SC-008): the Evidence section on `<local>/problems/stripe-webhooks-vercel-cold-starts` contains 7 `<article>` elements (5 unblurred + 2 blurred) + 1 `<aside>` CTA = 8 card-like elements total.
  - **FrequencyChart toggle walk** (SC-006): in a browser at `<local>/problems/stripe-webhooks-vercel-cold-starts`, click each of the 4 time-range buttons (7d / 30d / 90d / All). The SVG `<path>` re-renders with a different shape per click; the active button's `aria-pressed="true"` (others `aria-pressed="false"`); with OS `prefers-reduced-motion: reduce` ON, the re-render is instant (no animation).
  - **EvidenceCTA + SampleBanner CTAs** (SC-009 + SC-010): `curl -s <local>/problems/stripe-webhooks-vercel-cold-starts | grep -oE 'href="/signup"' | wc -l` returns ≥ 2 (one from SampleBanner, one from EvidenceCTA; plus any other prior-slice `/signup` link in TopNav etc.).
  - **STOP-1 count cross-check re-run** (slice-011 count-drift lesson — same command as STOP 1 above):

    ```sh
    echo "=== SAMPLE_PROBLEMS structural ==="
    echo "  entries:                 $(grep -cE '^const [A-Z_]+: SampleProblem' apps/web/src/components/problem/sample-problems.ts)"
    echo "  stubBody: false:         $(grep -c 'stubBody: false' apps/web/src/components/problem/sample-problems.ts)"
    echo "  stubBody: true:          $(grep -c 'stubBody: true'  apps/web/src/components/problem/sample-problems.ts)"
    echo "  relatedProblems items:   $(grep -A 4 'relatedProblems:' apps/web/src/components/problem/sample-problems.ts | grep -c '^\s*{ slug:')"
    echo "  frequencyData windows:   $(grep -E '\"(7d|30d|90d|all)\":' apps/web/src/components/problem/sample-problems.ts | wc -l)"
    echo "  sourcesBreakdown rows:   $(grep -A 5 'sourcesBreakdown:' apps/web/src/components/problem/sample-problems.ts | grep -c 'name:')"
    echo "  blurred quotes (true):   $(grep -c 'blurred: true'  apps/web/src/components/problem/sample-problems.ts)"
    echo "  blurred quotes (false):  $(grep -c 'blurred: false' apps/web/src/components/problem/sample-problems.ts)"
    ```

    **Expected output**: `5 / 1 / 4 / 4 / 4 / 4 / 2 / 5`. Drift = hard fail; fix `sample-problems.ts` before pushing to preview.
  - **Discipline greps on all 20 new files** (SC-016): under `apps/web/src/components/problem/` + `apps/web/src/app/problems/`:
    - `hex (#[0-9A-Fa-f]{3,8})` — clean.
    - `font-family|font-name` — clean.
    - `copy-context exclamation` (`grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<' apps/web/src/components/problem/ apps/web/src/app/problems/`) — clean **except** for JS-operator carve-out: any `!metaKey` / `!== 0` / `!problem` / `!figure`-style operators are code, not voice.
    - `emoji` — clean.
    - `amazing|awesome` (case-insensitive) — clean.
  - **LINK-FLIP regression check** (SC-005 — the slice's US2-defining payoff): `git diff --stat 1c26385..HEAD -- apps/web/src/components/landing/sample-reports.tsx` returns empty (file UNCHANGED). `curl -s <local>/ | grep -oE 'href="/problems/[^"]+"' | sort -u` returns exactly 3 hrefs: `/problems/llm-streaming-cdn-buffering`, `/problems/expo-ota-ios-18-4`, `/problems/pgvector-index-degradation-2m`. Visiting each via the actual SampleReports landing card (browser click) lands on the corresponding stub page (HTTP 200; was a known-out-of-scope soft-404 pre-slice-012).
  - **Slice-integrity diff check** (SC-018 / FR-026): `git diff --stat 1c26385..HEAD --` shows changes ONLY under `apps/web/src/components/problem/`, `apps/web/src/app/problems/[slug]/`, `specs/012-sample-report/`, and `CLAUDE.md` (the SPECKIT marker bump). **Zero modifications** under `apps/web/src/components/{landing,pricing,faq,about,contact,legal,blog,changelog}/`, `apps/web/src/lib/`, `apps/web/src/app/{,about,blog,changelog,contact,faq,pricing,privacy,terms}/page.tsx`, `apps/web/src/app/changelog.atom/`, `apps/web/src/app/layout.tsx`, `packages/`, `design/`, or `pnpm-lock.yaml`.
  - **`pnpm-lock.yaml` byte-stable** (SC-019): `git diff --stat 1c26385..HEAD -- pnpm-lock.yaml` returns empty (zero new deps).
  - **No dark-mode class names introduced** (SC-020): `grep -rEn "dark:|data-theme" apps/web/src/components/problem/ apps/web/src/app/problems/` returns 0 (Editorial Light only this slice; `next-themes` integration is slice 013).
  - **Responsive sweep** at 320 / 375 / 768 / 1024 / 1280 / 1440 on `/problems/stripe-webhooks-vercel-cold-starts` — no h-scroll, no overlap, no clipped text; two-column body collapses to single-column below `md`; sticky right rail releases its sticky positioning below `md`; SampleBanner stays full-width at every viewport.
  - **Visual diff** (SC-001) vs `design/Public_pages.pdf` page 7 at 1280 width within a 4px tolerance per section (sample banner, breadcrumb, hero with momentum/source badges/save+share, two-column body with sources card + related-problems card, frequency chart, evidence list with blurred preview, gated CTA).
  - **Stub treatment visual diff**: each of the 4 stub routes renders the SampleBanner + TopNav + Breadcrumb + ProblemHero + "Full problem report forthcoming." caption + SiteFooter — no body, no sources card, no frequency chart, no evidence list, no related-problems card.
  - **Slice-005/006/008/009/010/011 cross-slice regression checks**:
    - `/` (slice 005) still renders Hero + SourceStrip + HowItWorks + SampleReports + PricingTeaser + SiteFooter; the 3 SampleReports cards' hrefs flip to live stub pages.
    - `/pricing` (slice 006/007) Enterprise card "Contact sales →" still lands on `/contact` (slice 008).
    - `/faq` (slice 006) rail / accordion / bottom CTA still work; footer "Help center" still goes to `/faq`.
    - `/about` and `/contact` (slice 008) still render.
    - `/terms` / `/privacy` / `/security` / `/gdpr` (slice 009) still render with intact `TocRail` behavior.
    - `/blog` (slice 010) index + 7 article slugs still render with intact `BlogRailToc` + `BlogFilterChips` behavior.
    - `/changelog` + `/changelog.atom` (slice 011) still render with intact `ChangelogJumpNav` behavior + valid Atom XML.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T022 · [US3] VERIFY — preview parity (gate)
Push the branch via gh-token HTTPS workaround if SSH agent stale (slice-011 carry-forward pattern); confirm the Vercel preview.
- **Depends on**: T021
- **Verify (SC-021)**:
  - **Push**: `git push -u origin 012-sample-report`. If SSH agent refuses, fall back to `GH_TOKEN=$(gh auth token) git push "https://oauth2:${GH_TOKEN}@github.com/cornel-stack/bristle.git" 012-sample-report:012-sample-report`.
  - **Preview URL pattern**: `https://bristle-git-012-sample-report-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api repos/cornel-stack/bristle/commits/<sha>/check-runs` or `gh api repos/cornel-stack/bristle/deployments?sha=<sha>` after the Vercel build completes).
  - **All 5 `/problems` routes resolve on preview**:
    ```sh
    for slug in stripe-webhooks-vercel-cold-starts \
                webhook-ordering-on-retries \
                llm-streaming-cdn-buffering \
                expo-ota-ios-18-4 \
                pgvector-index-degradation-2m; do
      echo "$slug → $(curl -sI <preview>/problems/$slug | head -1)"
    done
    ```
    Expected: 5 × `HTTP/2 200`.
  - **404 case on preview**: `curl -sI <preview>/problems/this-does-not-exist` returns HTTP 404.
  - **LINK-FLIP regression on preview** (SC-005 + SC-021): from `<preview>/`, the 3 SampleReports landing cards' hrefs resolve to live HTTP 200 stub pages without any edit to `sample-reports.tsx`.
  - **Prior-slice regression on preview** — 18 prior routes return 200:
    - 9 from slices 005-009: `/`, `/about`, `/contact`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/security`, `/gdpr`
    - 8 from slice 010: `/blog` + 7 `/blog/[slug]` entries
    - 2 from slice 011: `/changelog` + `/changelog.atom`
    All 18 + the 5 new + 1 stub-404 case = 24 curl assertions on preview.
  - **No body `<meta robots>` on `/problems/stripe-webhooks-vercel-cold-starts`**: `curl -s <preview>/problems/stripe-webhooks-vercel-cold-starts | grep -c '<meta[^>]*name="robots"'` returns 0 (the `x-robots-tag: noindex` HTTP header is the Vercel preview default — same artifact as prior slices, not a body meta; the page is indexable in production).
  - **No client-side console errors** on any of the 24 routes in the browser console.
  - **`FrequencyChart` behavior on preview**: click each of the 4 time-range buttons → SVG re-renders + `aria-pressed` flips; OS `prefers-reduced-motion: reduce` honored.
  - **DonutChart on preview**: `curl -s <preview>/problems/stripe-webhooks-vercel-cold-starts | grep -c '<path d=' ` returns ≥ 4 (one per segment, plus any other `<path>` in the page); per-segment `<title>` elements present.
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — Sample report detail page live locally and on the preview; 3 slice-005 SampleReports landing cards flip from soft-404 to live stub pages without any edit to `sample-reports.tsx`; Stripe full report renders complete page per design page 7; slice complete.

---

## Dependencies & Execution Order

```
Batch A:
  T001 (types.ts)
    ├── T002 [P] (donut-math.ts)         — depends on T001 (SampleProblemSourceRow)
    ├── T003 [P] (frequency-math.ts)     — depends on T001 (FrequencyPoint)
    └── T004 [P] (sample-problems.ts)    — depends on T001 (SampleProblem, Full, Stub)

Batch B (all depend on T001; some on Batch A helpers):
  T005 [P] (SampleBanner)                — depends on (none beyond convention; logically T001)
  T006 [P] (ProblemBreadcrumb)           — depends on T001
  T007 [P] (ProblemMomentumChip)         — depends on T001
  T008 [P] (ProblemSourceBadge)          — depends on T001
  T009    (ProblemHero)                  — depends on T001 + T007 + T008
  T010 [P] (ProblemPullQuote)            — depends on T001
  T011    (ProblemBody)                  — depends on T001 + T010
  T012 [P] (DonutChart)                  — depends on T001 + T002
  T013    (SourcesCard)                  — depends on T001 + T012
  T014 [P] (RelatedProblemsCard)         — depends on T001
  T015 [P] (EvidenceQuote)               — depends on T001
  T016 [P] (EvidenceCTA)                 — depends on (none)
  T017 [P] (FrequencyChart, CLIENT)      — depends on T001 + T003

Batch C (sequential):
  T018 (EvidenceList)                    — depends on T001 + T015 + T016
  T019 (ProblemLayout)                   — depends on T001 + T005 + T006 + T009 + T011 + T013 + T014 + T017 + T018
  T020 (/problems/[slug]/page.tsx)       — depends on T004 + T019

Batch D:
  T021 (local gate)                      — depends on T020
  T022 (preview parity)                  — depends on T021
```

### Critical dependency edges

- **T001 → EVERYTHING (the hardest gate of the slice)**: type-only module. T002 + T003 + T004 + T006 + T007 + T008 + T009 + T010 + T011 + T012 + T014 + T015 + T017 + T018 + T019 all import a type from it. (T005 and T016 don't strictly need types but follow the convention.) `pnpm typecheck` cannot pass for any downstream task until T001 compiles.
- **T004 (sample-problems.ts) → T020 (page.tsx)**: `generateStaticParams` enumerates the 5 prerendered slugs by reading `SAMPLE_PROBLEMS.map((p) => ({ slug: p.slug }))`. Without T004 the route can't enumerate slugs and the build fails before any other gate runs.
- **T004 → ALL of Batch B/C indirectly**: every render of `ProblemLayout` reads from a `SampleProblem` record produced by T004. The link-flip regression depends on T004's slugs matching the slice-004 seed verbatim (3 of 4 stubs) + adding the 4th slice-012-local slug (`webhook-ordering-on-retries`).
- **Discriminated-union narrowing (HARD GATE)**: T001's `SampleProblem = SampleProblemFull | SampleProblemStub` discriminator MUST narrow correctly. T011 (ProblemBody) and T019 (ProblemLayout) both branch on `if (problem.stubBody) {...} else {...}` and rely on TypeScript narrowing for full-report field access. If T001's discriminator is mis-typed (e.g. union members don't share a literal-typed `stubBody` field), T011 and T019 cannot read `problem.body` / `problem.frequencyData` / etc. without non-null assertions, which violates the verify gates.
- **T019 (ProblemLayout) — SampleBanner-above-TopNav composition**: this is the architectural-first composition pattern documented in plan §8 + quickstart.md. The `<SampleBanner />` element MUST be the first sibling under the route's JSX root (above `<TopNav />`). Verifiable via `grep -nE "<SampleBanner|<TopNav" apps/web/src/components/problem/problem-layout.tsx | awk '{print NR}'` confirming SampleBanner's line number < TopNav's line number.
- **T017 (FrequencyChart, client) — sole client island**: depends on T003 (frequency-math.ts) for the polyline path builder AND T001 (SampleProblemFrequencyData type). This is the only file under `apps/web/src/components/problem/` carrying `"use client"`. Verifiable at STOP 2 + STOP 4 via `grep -l '"use client"' apps/web/src/components/problem/` returning exactly `frequency-chart.tsx`.
- **T012 (DonutChart) → T013 (SourcesCard)**: SourcesCard composes DonutChart. T013 cannot start until T012 lands.
- **T015 + T016 → T018**: EvidenceList composes 7 EvidenceQuote + 1 EvidenceCTA.
- **All Batch B → T019**: ProblemLayout composes 9 Batch B components (T005, T006, T009, T011, T013, T014, T017, T018, plus the slice-005 TopNav + SiteFooter reuse).
- **T019 → T020 → T021 → T022**: the page consumes the layout; the local gate runs after the page is wired; the preview parity gate runs after local checks pass + the branch is pushed.

### Parallel opportunities

- **Batch A**: T002, T003, T004 are all [P]-parallel after T001 lands. All 3 import from `./types` but don't reference each other.
- **Batch B** (wide): **10 [P] tasks** at tier 0 (T005, T006, T007, T008, T010, T012, T014, T015, T016, T017) — independent files, can land in parallel after Batch A. Maximum parallel width = **10**.
- **Batch B tier 1** (sequential): T009 depends on T007 + T008; T011 depends on T010; T013 depends on T012. These 3 land after their tier-0 siblings.
- **Batch C**: fully sequential (T018 → T019 → T020). No parallel opportunities within Batch C.
- **Batch D**: fully sequential (T021 → T022).

### Sequencing concerns

1. **T001 (`types.ts`) is the hardest gate of the slice** — must compile before any of T002-T020 (every Batch A/B/C task imports a type from it except T005 and T016 by convention). Recommended order: T001 first; then T002 + T003 + T004 ([P]); then STOP 1 (including the count cross-check); then the Batch B tier-0 [P] cohort (T005/T006/T007/T008/T010/T012/T014/T015/T016/T017 in parallel where staffed) → tier-1 sequential pairs (T009, T011, T013); then STOP 2; then sequentially through Batch C (T018 → T019 → T020); then the two gates.
2. **STOP-1 count cross-check is the slice-011 lesson applied**: every count claim (5 entries / 1 false / 4 true / 4 related / 4 windows / 4 sources / 5 visible / 2 blurred) MUST agree across spec.md / plan.md / tasks.md / sample-problems.ts. If the data store drifts after T004 lands, every downstream component renders the wrong shape. The cross-check command in STOP 1 is the hard gate.
3. **T004 (`sample-problems.ts`) is the second-hardest gate** — its 5-slug enumeration drives T020's `generateStaticParams`. The 3 seed-flip slugs (LLM streaming / Expo OTA / pgvector) MUST match `packages/db/src/seed.ts` verbatim, or the link-flip regression fails (SC-005). The 4th slug (`webhook-ordering-on-retries`) is slice-012-local — verify it does NOT appear in the slice-004 seed (a diff should show only this one slug as differing between the two slug lists).
4. **Discriminated-union narrowing is enforced at typecheck time**: if T011 or T019 reaches for a non-null assertion on `problem.pullQuote` / `problem.body` / `problem.frequencyData` / `problem.evidenceQuotes` / `problem.relatedProblems` / `problem.sourcesBreakdown`, the discriminator narrowing isn't being honored. The Verify line on T011 + T019 greps for this — and STOP 2 + STOP 4 re-grep.
5. **SampleBanner-above-TopNav** is a new project precedent (plan §8). If `ProblemLayout` accidentally composes `<TopNav />` before `<SampleBanner />`, the design's visual hierarchy breaks (the banner appears inside the page content instead of above the persistent nav). The Verify line on T019 greps for the line-number ordering.
6. **The single-client-island check** runs at STOP 2 AND STOP 4 — if any Batch B component accidentally adds `"use client"` (e.g. DonutChart converted to a client component for a hover-tooltip pop), the discipline breaks. Recommendation: keep DonutChart's per-segment hover affordance as the SVG `<title>` element (native browser tooltip, server-renderable) — no client conversion needed.
7. **Visual diff + Lighthouse + responsive sweep + FrequencyChart toggle walk + visual blur check defer to reviewer** at T021/T022 — same CLI-agent constraint as prior slices. Code-side proxies (build, greps, diff-stat, route-200 curls, meta-tag curls, dep audit, deep-link HTML inspection, `<path>` count, `<article>` count, single-client-island count) are agent coverage; viewport sweep + Lighthouse + PDF visual diff + browser-driven FrequencyChart behavior + reduced-motion runtime check + blur-sm visual validation + DonutChart segment-proportion visual verification are reviewer coverage.
8. **Link-flip regression** (SC-005) is the US2-defining verification — `apps/web/src/components/landing/sample-reports.tsx` MUST remain in the `git diff --stat` empty zone. The 3 hrefs were authored in slice 005 to point at `/problems/{slug}`; all 3 flip live the moment T020 lands.
9. **No rebase noise expected at T022 push** — branch is on top of clean `main` from the start of this slice (no stacking; verified at plan time, `1c26385` is the baseline).
10. **`1c26385` is the true baseline** for diff commands — the local `origin/main` tracking ref is in sync with origin (verified at session start). Use the explicit baseline SHA in all `git diff --stat <baseline>..HEAD` commands at T021.

### Surprising parallelism opportunity

**Batch B has 10 [P] tasks at tier 0** — the widest parallel batch of any slice so far (vs slice 010's 8, slice 011's 5). The reason: slice 012 has more independent primitive components (SampleBanner / Breadcrumb / MomentumChip / SourceBadge / PullQuote / DonutChart / RelatedProblemsCard / EvidenceQuote / EvidenceCTA / FrequencyChart) because the design page 7 has more discrete UI parts than the changelog or blog pages. The 3 sequential tier-1 pairs (T009/T011/T013) are minor compositions of 2-3 children each. With staffing, Batch B could land in 2 cohorts (10 + 3); without staffing (single-implementer), the natural order is the [P] cohort first then the sequential pairs.

---

## Implementation strategy (4 stops)

1. **Stop 1 (Batch A)**: foundations — `types.ts` (discriminated union + sub-shapes) + `donut-math.ts` (polar-to-cartesian + describeArc + buildDonutSegments) + `frequency-math.ts` (line-path builder + ticks) + `sample-problems.ts` (5 entries verbatim + `[PLACEHOLDER]` header). STOP-1 gate verifies type exports, discriminator narrowing sanity, math helper exports, **count cross-check** (5/1/4/4/4/4/2/5), voice grep clean, slug cross-check vs slice-004 seed.
2. **Stop 2 (Batch B)**: 13 primitive components (12 server + 1 client). Client surface is exactly 1 file (`frequency-chart.tsx`). The discriminated-union narrowing gate runs on T011 + T019. The SampleBanner-above-TopNav precedent is documented in T019 in Batch C. STOP-2 gate verifies typecheck/lint + `"use client"` count = 1 + hex/font/voice/emoji greps clean across all 13 files + token-validation re-affirmed for `fill-text-tertiary`.
3. **Stop 3 (Batch C)**: EvidenceList + ProblemLayout + route. The `/problems/[slug]/page.tsx` add (T020) wires generateStaticParams to T004's 5 slugs and generateMetadata to per-problem fields. STOP-3 gate verifies build + first read of First Load JS budget on all 5 routes + 5×200 + 1×404 curl + link-flip pre-check.
4. **Stop 4 (Batch D)**: full local quality gate (typecheck/lint/build + bundle budget + Lighthouse + responsive + greps + FrequencyChart toggle walk + DonutChart segment check + EvidenceList 8-element count + Save/Share presentational + breadcrumb plain-text + single-client-island + count cross-check re-run + link-flip regression + slice-005/006/008/009/010/011 regressions clean), then preview parity (push + Vercel preview + all 24 routes return 200 + link-flip regression on preview + cross-slice regressions clean).

## Task count

**22 tasks** — **20 commit-producing** (T001-T020), **2 verification gates** (T021 + T022). Grouped into **4 batches / 4 stops**. Slightly larger than slice 011 (15 tasks) because: 1 additional pure helper module (slice 011's `atom-xml.ts` ≈ slice 012's `donut-math.ts` + `frequency-math.ts`); 13 primitive components vs slice 011's 7; 2 hand-rolled SVG visualizations vs slice 011's 1; 1 architectural-first composition (SampleBanner above TopNav). Comparable in scope to slice 010 (18 tasks).

## Out of scope (no tasks)

- `next-themes` integration (Editorial Dark theme) — **slice 013** (per session decision; was originally bundled per slice-006 plan §6 D-d).
- Real evidence quote content for `SAMPLE_PROBLEMS[0].evidenceQuotes` — **founder edit pass before launch**; 7 placeholder entries ship this slice.
- Real frequency time-series for `SAMPLE_PROBLEMS[0].frequencyData` — **founder edit pass before launch**; 4 synthesized windowed datasets ship matching the +312% MoM claim.
- Real sources breakdown for `SAMPLE_PROBLEMS[0].sourcesBreakdown` — **founder edit pass before launch**; 26/13/3/5 = 47 distribution ships as synthesized placeholder.
- Wire the slice-005 landing `Hero` `ProblemCardFull` to a `/problems/{slug}` link — **tracked follow-up** (plan §13); requires touching `packages/ui/problem-card-full.tsx` + `apps/web/src/components/landing/hero.tsx`; defer to slice 2.7 or batch with the next polish opportunity. Stripe full page remains direct-URL only this slice.
- Wire `ProblemBreadcrumb` segments to category landing pages — **tracked follow-up**; presentational text only this slice (FR-006); swap spans for `<a>` tags when `/library` index + `/categories/[category]` routes land.
- Real `Save` and `Share` behavior — **tracked follow-up**; presentational `<button type="button">` this slice. Real Save (account-bound library) and Share (URL copy / OG card) are owned by the app/onboarding tier.
- Per-problem OG image generation via `@vercel/og` — **tracked follow-up**; all 5 routes share `/og-image.png` this slice.
- Permalink anchors on individual evidence quotes — out of scope; no `#quote-N` fragments this slice.
- Frequency chart cross-fade animation on toggle — out of scope; instant re-render this slice. The reduced-motion fresh-read pattern is sketched as a no-op placeholder for future motion polish.
- **Extract shared `SectionScrollSpyRail`** from `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) + `ChangelogJumpNav` (011) — **highest-priority deferred refactor** carried from slice 011; slice 012 does NOT add a fifth structural mirror (sticky right rail in `ProblemLayout` is a simple `<aside className="md:sticky md:top-grid">` without scroll-spy state), so the 4-mirror pressure is unchanged.
- **Extract `PullQuote` to `packages/ui/`** — **NEW tracked follow-up**; slice-010 `InlinePullQuote` + slice-012 `ProblemPullQuote` (T010) are visually-and-prop identical. Recommended timing: when a 3rd consumer appears OR batch with the `SectionScrollSpyRail` refactor.
- Adding `webhook-ordering-on-retries` to `packages/db/src/seed.ts` — out of scope; the 4th stub is slice-012-local by design (would touch `packages/` and violate SC-018).
- Reading from `@bristle/db` at request time on `/problems/[slug]` — out of scope; the route is content-static via `SAMPLE_PROBLEMS` (build-time prerender). When real problem ingestion goes live (Tier 5), the page may flip to DB-backed rendering.
- All carry-forwards from slice 011 (RSS feed for `/blog`, blog author profiles, blog category SEO deep pages, slice-005 `<main>` landmark fix, NewsletterStub markup convergence, `/privacy/sub-processors` deep page, refund-policy alignment audit, form spam protection, Resend Vitest harness, per-article OG image generation for blog posts, custom Bristle-voiced 404, Atom feed validation tooling) — none addressed this slice.
- Any modifications to slice-005 chrome (`top-nav.tsx`, `site-footer.tsx`, `sample-reports.tsx`, `hero.tsx`), slice-006 pricing/FAQ, slice-008 about/contact, slice-009 legal, slice-010 blog, slice-011 changelog, or any `lib/` / `packages/` module.
- Any modifications to `design/Public_pages.pdf` or any other read-only `design/` / `docs/` PDF.
- Any DB schema change, any new `@bristle/db` query helper.
