# Research: Slice 4.3 (Problem Detail) — decisions

Read-only UI over the slice-4.1 fixtures. Every decision below was grounded by reading the actual source (DB schema, `getProblemDetail`, and each public-detail leaf), not assumed.

## 1. Tab interaction model (A1)

- **Decision**: A true ARIA **tablist with swapped panels** — one panel visible at a time — driven by one small client island; active tab synced to the `?tab=` searchParam (validated against the 7 keys; absent/unrecognized → `synthesis`). The right rail renders in the layout composer **outside** the island, so it persists across panels.
- **Rationale**: The spec's "keyboard-navigable, `?tab=` deep links" is tablist semantics, and page 2 shows a real tab strip with Synthesis active/underlined. This is distinct from the Tier-2 FAQ/legal **scroll-spy** (one long page, highlight-on-scroll). Founder confirmed swapped panels; the page-2 artboard's vertical stacking is a full-page design rendering of all panel contents, not a runtime "all visible at once."
- **Alternatives rejected**: Scroll-spy anchors (wrong IA, not what the comp's tab strip implies); pure server `?tab=` round-trips per switch (loses instant switching + needs a request per tab — worse UX for a read screen). The island keeps switching instant and still deep-linkable.

## 2. Data source — no `getProblemDetail` extension (A4)

- **Decision**: Read everything from the existing `getProblemDetail(slug)`; add **one** read-only helper `getSavedProblemIds(userId)` only for the Save button's state.
- **Rationale**: `getProblemDetail` already returns full child rows — `{ problem, sources, quotes, solutions, wtp, personas, related, frequency }` (verified at `packages/db/src/queries.ts:411`). Related links resolve off the **inline** `problem_related.target_slug` (FK'd → slug set → link; label-only → null → unlinked) — no join needed. The only data not in `getProblemDetail` is "did the viewer already save this problem," which is user-scoped → the one new helper.
- **Alternatives rejected**: Extending `getProblemDetail` to carry saved-state (wrong layering — it's problem-scoped, not user-scoped; would also break its public reuse); a write path for Save (out of scope — mutation ships in 4.5).

## 3. Reuse vs wrap — public-detail leaf inventory (A2)

The slice-2.6 leaves in `apps/web/src/components/problem/*` **also render the live public `/problems/[slug]`**. Hard guard: **never edit a shared leaf to fit the DB shape.** Read each; the boundary adapter absorbs shape differences; a genuine contract gap is resolved by **wrapping** (a new in-app component), surfaced as a deliberate decision.

### 3.1 Reused as-is (source-key-agnostic — adapter absorbs)

- **`DonutChart`** `{rows:{name,count}[], total, ariaLabel}` — `name` is a display string, palette by sort order. Adapter feeds `{name: resolveBadge label, count: quoteCount}`. `forum → "Forums"` is just a name; no coupling. ✅
- **`SourcesCard`** `{rows, total}` — wraps DonutChart + a legend; same `{name,count}` rows. ✅ used for the rail.
- **`FrequencyChart`** `{data: Record<7d/30d/90d/all, {date,count}[]>}` — client component (window toggle state). Adapter buckets `problemFrequencyPoints` into the four windows. ✅ **but** verify it renders the validation-threshold marker + "N mentions · +X% vs prior period" caption (page 2 shows both). If absent → **wrap** with an overlay marker + caption; do not mutate. (STOP-2 check.)
- **`ProblemMomentumChip`** `{momentum:{delta,windowDays}}` — pure presentational. Adapter maps `momentumPct → {delta:"+312%", windowDays:14}`. ✅
- **`donut-math` / `frequency-math`** — pure helpers, reused transitively.

### 3.2 Contract GAP → wrap (public leaf NOT reused)

- **`EvidenceQuote` / `EvidenceList`** — the public quote type `SampleProblemEvidenceQuote` has `source: SampleProblemSourceKey` = `github|hackernews|stackoverflow|reddit|producthunt|appstore|playstore` (**no `forum`**), engagement hardwired to `upvotes`+`commentCount`, a sample-only `blurred` flag, **no** WTP chip; `EvidenceList` has **no** source-filter chips. The DB quote (`problemQuotes`) carries `engagementValue`+`engagementLabel` (reactions/points/reputation) **or** `rating` (app-store stars), `isWtpSignal`+`statedPriceUsd`, and `source_key` including **`forum`** (21 forum quotes are seeded). → **GAP on four axes.** Build `evidence-panel` + `evidence-quote-row` reusing the visual structure, routing source through `@bristle/ui` source-icons (forum-capable since slice-4.2), modeling DB engagement/rating + WTP chip + show-more + the All/GH/HN/SO/Other filter chips.
- **`ProblemSourceBadge`** `{source: SampleProblemSourceKey}` — **no `forum`**. → header source-badge row + rail use `@bristle/ui` source-icons via `resolveBadge`, not this leaf.
- **`RelatedProblemsCard`** `{items:{slug,title,leadSnippet}[]}` — hardcodes `<Link href={/problems/${slug}}>` (**public** route) and makes slug/title/leadSnippet **mandatory**, so it cannot represent a DB label-only related row (`targetSlug = null`, only a `label`). → in-app related list: linked `/app/problems/[targetSlug]` when present, label-only **unlinked** otherwise (satisfies FR-013/AC-6 directly).

- **Rationale for wrap-not-mutate**: editing any of these to add `forum`/engagement/WTP/app-link would change the live public sample report — a regression risk and an A2 violation. The adapter + thin in-app components isolate the app's richer DB shape from the public leaves' frozen contracts.
- **Alternatives rejected**: widening `SampleProblemSourceKey` to include `forum` (mutates a shared type the public store depends on); promoting the public leaves into `@bristle/ui` and re-parameterizing (a refactor beyond a read-only slice — candidate for a later consolidation, noted as TF-022 progress, not done here).

## 4. Source model + 5-source delta (FR-015/016)

- **Decision**: All source rendering (donut, header badge row, evidence filter chips, "N sources") routes `source_key` through `@bristle/shared resolveBadge` — five live sources only: `gh→GitHub`, `hn→Hacker News`, `so`+`se→Stack Overflow` (rolled to one badge, label per slice-4.2 D6), `appstore→App Store`, `forum→Forums`. Donut slices = per-source quote counts summing to the **quote** total; header "N sources" = **distinct-source** count.
- **Rationale**: Single badge source-of-truth (no parallel mapping); the standing delta drops Product Hunt / Google Play even though the page-2 comp legend lists Product Hunt (the seeded data carries none).
- **Alternatives rejected**: rendering the comp's Product Hunt slice (no seeded data; violates the delta).

## 5. Save state, charts, motion

- **Save state (A3)**: `getSavedProblemIds(userId)` (read-only, seam-parameterized). Save renders "Saved"/"Save"; click inert (4.5). Compare/Alert me/Export visual-only (4.7/4.6/Tier 6).
- **Charts (§9.5)**: no new charting dep — reuse the hand-rolled SVG `FrequencyChart`/`DonutChart`; momentum is the chip (+ optional decorative sparkline via the dashboard `buildSparklinePath` pattern if the comp warrants — page 2 shows chip/delta, so sparkline is optional).
- **Reduced motion**: tab/panel transitions and any chart animation honor `prefers-reduced-motion` (0ms / opacity-only).

## 6. Genuine-0 + edge states (FR-012/013, SC-005/006)

- No-WTP problem (**pgvector**, no `wtp_signals` row → `wtp: null`): WTP tab + rail panel render an explicit dry empty state ("No willingness-to-pay signal yet."), not a blank/broken panel.
- Label-only related rows: rendered as text, no link, no 404.
- App-store quotes: render `rating` (stars) where threaded sources render `engagementValue`+`engagementLabel`.
- Long quote: "show more" affordance.
- Unknown `?tab=`: default `synthesis`. Unknown slug: `notFound()`. Anonymous: existing `/app` redirect.

## 7. Verification split (sandbox vs founder-run)

- **Sandbox**: anonymous `/app/problems/[slug]` → 307 `/login`; `pnpm build`; tsx probe of the adapter + `getSavedProblemIds` over the seeded rows (hero, a forum-source problem, pgvector 0-WTP, a label-only related); integrity diff (`git diff --stat` shows no `components/problem/` or schema/seed change).
- **Founder-run (preview, real login)**: pixel fidelity vs page 2 in light + dark + mobile (the STOP-5 checklist in plan.md).
