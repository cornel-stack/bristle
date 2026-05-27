# Feature Specification: Sample Report Detail Page

**Feature Branch**: `012-sample-report`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: Slice 012 — public sample-report detail page surface that demonstrates the Bristle product's output without requiring sign-up. One full sample problem matches `design/Public_pages.pdf` page 7 verbatim; four stub problems carry minimum metadata to render the same detail route without 404ing. Three of the four stub slugs match the slice-005 landing SampleReports card hrefs (so those landing cards flip from soft-404 destinations to live URLs without any edit to the landing component); the fourth stub (`webhook-ordering-on-retries`) is reached only via the Stripe full report's RelatedProblemsCard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Anonymous visitor reads the full Stripe sample report (Priority: P1)

A bootstrapped indie founder lands on the marketing site, clicks one of the SampleReports cards (or arrives via a direct deep link), and reads a fully-rendered Bristle problem report — title, momentum, sources breakdown, frequency chart, body prose, related problems, and 5 unblurred evidence quotes — without being asked to sign up. They form a concrete opinion about whether Bristle's output is worth $29–$79/month before creating an account.

**Why this priority**: This is the central conversion artifact for the whole public surface. Slices 005–011 brought the visitor to the door; this slice is what's behind it. Without this page, every marketing claim ("evidence-backed problem reports") is unsubstantiated to a skeptical reader.

**Independent Test**: Visit `/problems/stripe-webhooks-vercel-cold-starts` on a fresh production build. The page must render every region from the design (sample banner → top nav → breadcrumb → hero → two-column body → frequency chart → evidence → footer) without sign-up, without console errors, and within the performance budget. Reader walks away with a concrete sense of what a Bristle report contains.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor, **When** they navigate to `/problems/stripe-webhooks-vercel-cold-starts`, **Then** the page returns HTTP 200, renders every design region from `design/Public_pages.pdf` page 7, and matches the design within 4px visual tolerance at 1280px width.
2. **Given** the full report is rendered, **When** the reader clicks 7d / 30d / 90d / All on the frequency-chart toggle, **Then** the chart re-renders with the corresponding windowed dataset and the active button reports `aria-pressed="true"`.
3. **Given** the reader scrolls past the body section, **When** they reach the evidence list, **Then** five quote cards are fully readable, two preview cards have visually blurred quote text with the author row still visible, and a gated CTA card invites sign-up.
4. **Given** the reader wants to subscribe, **When** they click "Start free" in the sample banner or "Create free account" in the evidence CTA, **Then** they navigate to `/signup` (which is a known carry-forward soft-404 owned by a future auth slice).

---

### User Story 2 — Anonymous visitor follows a sample-grid card or related-problems link to a stub report (Priority: P1)

The same visitor scans the landing-page SampleReports section and clicks one of the three sample cards (LLM streaming, Expo OTA, or pgvector); separately, a visitor reading the full Stripe report clicks one of the four related-problems items in the right rail (webhook-ordering, LLM streaming, Expo OTA, or pgvector). In every case they arrive on a recognisable Bristle problem-detail page chrome that names the problem and announces that the full report is forthcoming — instead of a 404. They understand the cards and related-problems links are real destinations, not decorative, and trust the rest of the surface accordingly.

**Why this priority**: The link-flip is the contract between this slice and shipped slice 005. Without stub pages, three landing-card hrefs continue to soft-404 — a credibility puncture on the highest-traffic page of the site. The fourth stub (`webhook-ordering-on-retries`) is the topically-coherent first item of the Stripe report's RelatedProblemsCard, so its destination must also be live.

**Independent Test**: Without editing `apps/web/src/components/landing/sample-reports.tsx`, visit each of `/problems/llm-streaming-cdn-buffering`, `/problems/expo-ota-ios-18-4`, `/problems/pgvector-index-degradation-2m`, and `/problems/webhook-ordering-on-retries`. Each returns HTTP 200, renders the sample banner + nav + breadcrumb + hero with the problem's title and meta + a "Full problem report forthcoming." caption + footer. Visit the first three routes by clicking the landing cards in a real browser, and the fourth by clicking the top item of the Stripe page's related-problems list — they navigate, not 404.

**Acceptance Scenarios**:

1. **Given** the slice-005 landing page is rendered, **When** a visitor inspects the SampleReports card hrefs, **Then** the three hrefs point to three of the four stub slugs (LLM streaming, Expo OTA, pgvector) and each destination returns HTTP 200.
2. **Given** the Stripe full report is rendered, **When** a visitor clicks any of the four items in the RelatedProblemsCard, **Then** the link navigates to `/problems/{stub-slug}` and that destination returns HTTP 200.
3. **Given** a visitor lands on one of the three slice-004-seeded stub problem pages, **When** they read the hero, **Then** the title, momentum chip, source badges, first-seen date, quote count, and source count match the slice-004 DB seed for that slug.
4. **Given** a visitor lands on the new `/problems/webhook-ordering-on-retries` stub, **When** they read the hero, **Then** the title is "Webhook ordering on retries", the breadcrumb reads "Library / Devtools / Payments", and the meta row shows synthesized placeholder values consistent with the other stubs.
5. **Given** any stub page is rendered, **When** the visitor scrolls past the hero, **Then** the page shows a single short caption reading "Full problem report forthcoming." in place of the body / sources card / frequency chart / evidence list / related-problems card.

---

### User Story 3 — Visitor mistypes a slug or hits a discontinued URL (Priority: P2)

A visitor types `/problems/something-that-doesnt-exist`, follows a broken link from outside, or pastes a stale URL. They land on a clean 404 instead of a runtime error or a half-rendered page.

**Why this priority**: Required for trust at the boundary of the surface, but the five shippable slugs cover every link the product itself emits in v1.0 (three from the slice-005 SampleReports landing cards and four from the Stripe RelatedProblemsCard, overlapping the four stub slugs; the Stripe full page is direct-URL only) — the 404 case is only hit by external traffic.

**Independent Test**: Request `/problems/any-non-shipping-slug` (e.g. `/problems/foo`). The route returns HTTP 404 and renders the standard Next.js not-found page (or the project's not-found component when one exists in a later slice).

**Acceptance Scenarios**:

1. **Given** the five sample slugs are the only ones in the data store, **When** a request arrives for any other slug, **Then** the route invokes `notFound()` and the response status is 404.

---

### Edge Cases

- A visitor with `prefers-reduced-motion: reduce` toggles the frequency-chart time range — the chart re-renders without any transition or motion.
- A keyboard-only visitor tabs into the frequency-chart toggle — focus moves through the four buttons in DOM order, each button receives a visible 2px `accent/bristle` focus ring + 4px outer ring, and pressing Enter / Space activates it.
- A screen-reader user reaches the donut chart — they hear the four segment labels with quote count and percentage (e.g. "GitHub: 26 quotes, 55%") rather than an unannotated SVG.
- A screen-reader user reaches a blurred evidence card — the card announces its purpose ("Locked preview — sign up to read") and the blurred quote text is hidden from the accessibility tree.
- A visitor opens the page with JavaScript disabled — the page is fully readable; only the frequency-chart time-range toggle is non-interactive (the 90d view remains rendered as the default).
- A visitor saves or shares the page (Save / Share buttons) — the buttons are visibly present in the hero meta row but perform no action; this is documented and accepted for v1.0.

## Requirements *(mandatory)*

### Functional Requirements

**Route surface**

- **FR-001**: System MUST expose a dynamic route at `/problems/[slug]` that resolves exactly five shippable slugs in v1.0: `stripe-webhooks-vercel-cold-starts` (full), `webhook-ordering-on-retries` (stub), `llm-streaming-cdn-buffering` (stub), `expo-ota-ios-18-4` (stub), `pgvector-index-degradation-2m` (stub).
- **FR-002**: The five shippable slugs MUST be enumerated at build time so that each route is statically prerendered (no per-request database query in v1.0). Unknown slugs MUST return HTTP 404 via the framework's `notFound()` mechanism.
- **FR-003**: Each route MUST emit per-problem metadata for crawlers: page title, description, Open Graph type `article`, and an Open Graph image URL resolved from the project's canonical site URL constant.

**Full Stripe report layout (in design-order)**

- **FR-004**: System MUST render a `SampleBanner` strip ABOVE the top navigation containing the text "You're viewing a free sample — see the full library of 142k+ problems." and a "Start free →" CTA linking to `/signup` (the `/signup` route is the slice-005 known carry-forward soft-404 owned by a future auth slice).
- **FR-005**: System MUST reuse the slice-005 `TopNav` and `SiteFooter` components without modification.
- **FR-006**: System MUST render a breadcrumb row reading "Library / Devtools / Payments" as plain literal text with " / " separators; the breadcrumb MUST NOT contain anchor tags (the Library index and category pages do not yet exist).
- **FR-007**: System MUST render a `ProblemHero` containing a serif `h1` with the problem title, a meta row 1 (momentum chip "▲ +312% / 14d", five source badges, first-seen date "Feb 8", quote count "47 quotes", source count "6 sources"), and a meta row 2 with right-aligned `Save` and `Share` buttons.
- **FR-008**: The `Save` and `Share` buttons MUST be rendered as presentational `<button type="button">` elements with no onClick handler, no client state, and no persistence. Their presence preserves design parity; their inertness is accepted for v1.0.
- **FR-009**: System MUST render a two-column body section. The left column MUST contain a lead paragraph, an inline serif pull-quote with optional attribution, and a body paragraph (content strings provided in the data store). The right column MUST be sticky on `md` and above (matching the slice-010 BlogRailToc sticky pattern) and contain a `SourcesCard` and a `RelatedProblemsCard`.
- **FR-010**: The `SourcesCard` MUST display the eyebrow "SOURCES · 47 QUOTES", a hand-rolled SVG donut chart with four segments sized proportionally to the breakdown (GitHub 26 / Hacker News 13 / Stack Overflow 3 / Other 5 = 47 total), and a four-row breakdown list naming each source and its count.
- **FR-011**: The `RelatedProblemsCard` MUST display four list items, each linking to `/problems/{related-slug}` and showing the related problem's title and a short lead snippet. The four destinations MUST be exactly the four stub slugs shipping in this slice: `webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`. No duplicate links and no placeholder hrefs.
- **FR-012**: System MUST render a full-width frequency-chart section with the eyebrow "FREQUENCY · 60 DAYS", the headline "47 mentions · +312% MoM", a four-button time-range toggle (7d / 30d / 90d / All), a hand-rolled SVG line chart showing a rising trend, and x-axis labels at FEB 11, MAR 13, APR 12, MAY 10.
- **FR-013**: The frequency-chart time-range toggle MUST be fully interactive. Clicking 7d / 30d / 90d / All re-renders the SVG line chart with the corresponding pre-bundled windowed dataset. The 90d button MUST be active on first paint.
- **FR-014**: System MUST render a full-width evidence section containing an `h2` "Evidence (47 quotes)", five readable `EvidenceQuote` cards, two `EvidenceQuote` cards with blurred quote text and visible author rows, and one `EvidenceCTA` card. The CTA MUST read "Sign up to see all 47 quotes" with subline "Free, no credit card · See 6 existing solutions and 4 willingness-to-pay mentions" and a "Create free account →" link to `/signup`.

**Stub report layout**

- **FR-015**: For each of the four stub slugs, the route MUST render the SampleBanner + TopNav + Breadcrumb + ProblemHero + the literal caption "Full problem report forthcoming." + SiteFooter. The page MUST NOT render the two-column body, SourcesCard, RelatedProblemsCard, FrequencyChart, EvidenceList, or any pull-quote.
- **FR-016**: For the three stub slugs that match the slice-004 DB seed (`llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`), each ProblemHero MUST display the stub's seeded title, momentum, source badges, first-seen date, quote count, and source count. For the fourth stub (`webhook-ordering-on-retries`, NOT in the slice-004 seed), the ProblemHero MUST display synthesized placeholder values for momentum, first-seen date, source badges, quote count, and source count consistent in shape with the other stubs, plus the title "Webhook ordering on retries" and the breadcrumb ["Library", "Devtools", "Payments"].

**Link contract with shipped slices**

- **FR-017**: `apps/web/src/components/landing/sample-reports.tsx` MUST NOT be edited by this slice. After this slice ships, the three hrefs already present in that component MUST resolve to live HTTP 200 stub pages. The fourth stub (`webhook-ordering-on-retries`) has no landing card; it is reached only via the Stripe page's RelatedProblemsCard.
- **FR-018**: The shipped slice-005 top navigation and site footer MUST be reused without modification — this slice MUST NOT touch `top-nav.tsx`, `site-footer.tsx`, or the root layout.

**Voice & content discipline**

- **FR-019**: All user-visible copy MUST conform to CLAUDE.md §6 voice: no exclamation points, no "amazing/awesome", no emoji, no hype register.
- **FR-020**: All sample-problem content MUST be marked as placeholder at the top of the data store with the comment `// [PLACEHOLDER — sample problem content awaiting founder review before production launch]`.

**Accessibility**

- **FR-021**: The donut chart MUST expose per-segment accessible names (e.g. "GitHub: 26 quotes (55%)") via `aria-label` on each SVG path.
- **FR-022**: The frequency chart MUST expose `role="img"` with an `aria-label` describing the data; the toggle button group MUST use `role="group"` with each button reporting `aria-pressed` reflecting its active state.
- **FR-023**: Evidence quote cards MUST use semantic `<blockquote>` with `<cite>` for attribution. Blurred preview cards MUST mark the blurred quote text `aria-hidden="true"` and the wrapping card MUST carry a descriptive `aria-label` such as "Locked preview — sign up to read".

**Theming discipline**

- **FR-024**: This slice MUST ship Editorial Light treatment only. Dark-mode class names MUST NOT be introduced in any file touched by this slice; the `next-themes` integration is owned by the next slice and the components MUST pick up dark mode automatically through CLAUDE.md §4 tokens when that slice lands.
- **FR-025**: All colours, type, spacing, radii, and motion MUST resolve through the CSS custom-property tokens defined in `apps/web/src/app/globals.css`. Zero hex literals and zero font-family strings MAY appear in files touched by this slice. Both SVG charts MUST consume tokens via Tailwind utility classes (e.g. `fill-accent-bristle`, `stroke-border-default`), following the slice-011 ChangelogFigure pattern.

**Slice integrity**

- **FR-026**: This slice MUST NOT modify any file owned by slices 004 / 005 / 006 / 008 / 009 / 010 / 011, any file under `packages/`, any file under `design/`, or `pnpm-lock.yaml`. The slice is strictly additive at the file-system level.
- **FR-027**: This slice MUST NOT add any new top-level dependency. The donut chart and frequency chart MUST be hand-rolled SVG.

### Key Entities

- **SampleProblem**: A single problem-detail record consumed by `/problems/[slug]`. Carries `slug` (kebab-case; the three landing-flip stubs match the slice-004 DB seed verbatim, the fourth stub and the full slug are local to slice 012), `breadcrumb` (array of label strings, e.g. ["Library", "Devtools", "Payments"]), `title`, `momentum` ({delta string, windowDays number}), `firstSeenDate` (ISO string) + `displayDate` (human label), `quoteCount`, `sourceCount`, `sourceBadges` (array of source identifiers), and `stubBody` (boolean discriminator). When `stubBody === false`, the record additionally carries `lead`, `pullQuote` ({text, attribution}), `body`, `sourcesBreakdown` (array of {name, count} totalling `quoteCount`), `frequencyData` (object keyed by window with each value an array of {date, count} points), `evidenceQuotes` (array of seven items each {authorHandle, source, upvotes, commentCount, timestamp, text, blurred}), and `relatedProblems` (array of four items each {slug, title, leadSnippet}, where each slug is one of the four stub slugs).
- **SampleProblemDataStore**: An immutable, build-time-bundled collection of five `SampleProblem` records — one full (`stripe-webhooks-vercel-cold-starts`) and four stubs (`webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`) — that drives both `generateStaticParams` and the per-slug render. The store is the single source of truth for which slugs the route serves and what content each renders.
- **FrequencyWindow**: One of four pre-bundled time-window datasets (`7d`, `30d`, `90d`, `all`) on the full Stripe record. Each dataset is an array of `{date, count}` points whose shape rises from low Feb values to higher May values, consistent with the displayed "+312% MoM" claim.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/problems/stripe-webhooks-vercel-cold-starts` returns HTTP 200 on a local production build and matches `design/Public_pages.pdf` page 7 within 4px visual tolerance at 1280px width.
- **SC-002**: Each of `/problems/webhook-ordering-on-retries`, `/problems/llm-streaming-cdn-buffering`, `/problems/expo-ota-ios-18-4`, and `/problems/pgvector-index-degradation-2m` returns HTTP 200 with the stub treatment (banner + nav + breadcrumb + hero + "Full problem report forthcoming." caption + footer).
- **SC-003**: `generateStaticParams` enumerates exactly five entries and the production build report shows all five `/problems/[slug]` routes prerendered as static (●).
- **SC-004**: Per-problem `Metadata` exposes a non-empty title, a non-empty description, `og:type === "article"`, and a fully-qualified `og:image` URL on all five routes.
- **SC-005**: `apps/web/src/components/landing/sample-reports.tsx` shows zero modifications in `git diff` against `origin/main`; the three landing-card hrefs already in that component resolve to three of the four stub pages (curl-verifiable against the production build). The fourth stub (`webhook-ordering-on-retries`) has no landing-card link; it is reached only via the Stripe page's RelatedProblemsCard.
- **SC-006**: Clicking 7d / 30d / 90d / All on the frequency chart re-renders the SVG line chart with the corresponding dataset; the active button reports `aria-pressed="true"`; users with `prefers-reduced-motion: reduce` see an instant re-render with no transition.
- **SC-007**: The SourcesCard donut chart renders four segments whose central-angle proportions match 26 / 13 / 3 / 5; the four breakdown rows sum visibly to 47.
- **SC-008**: The evidence section renders exactly eight card-like elements: five readable quote cards, two blurred-preview quote cards, and one gated CTA card.
- **SC-009**: The SampleBanner "Start free →" link and the EvidenceCTA "Create free account →" link both point to `/signup`.
- **SC-010**: The ProblemHero displays a `Save` button and a `Share` button with no onClick handler, no client state, and no persistence behaviour.
- **SC-011**: The breadcrumb renders as plain " / "-separated text with zero anchor tags in the rendered HTML.
- **SC-012**: Any request to `/problems/{slug-not-in-the-five-shippable}` returns HTTP 404 via `notFound()`.
- **SC-013**: `pnpm typecheck`, `pnpm lint`, and `pnpm --filter web build` each exit 0 from the repo root.
- **SC-014**: First Load JS for each of the five `/problems/[slug]` routes is under 180 KB gzipped per the Next.js build report (expected range ~110–115 KB).
- **SC-015**: A Lighthouse audit of `/problems/stripe-webhooks-vercel-cold-starts` on the local production build scores ≥90 for Performance, Accessibility, Best Practices, and SEO. (On Vercel preview deploys, SEO of 60 is the documented `noindex` artifact and is acceptable.)
- **SC-016**: A grep across every new file under `apps/web/src/components/problem/` and `apps/web/src/app/problems/` returns zero hex literals (`#[0-9a-fA-F]{3,8}`), zero `font-family` strings, zero exclamation points in user-visible copy (the operator carve-out for JSX/TS syntax applies), zero emoji glyphs, and zero hype words.
- **SC-017**: Exactly one file under `apps/web/src/components/problem/` carries the `"use client"` directive (`frequency-chart.tsx`).
- **SC-018**: `git diff --stat` against `origin/main` shows zero modifications to any slice-004 / 005 / 006 / 008 / 009 / 010 / 011-owned file, zero modifications under `packages/`, zero modifications under `design/`, and zero modifications to `pnpm-lock.yaml`.
- **SC-019**: `pnpm-lock.yaml` is byte-identical to `origin/main` (no new top-level dependencies).
- **SC-020**: Zero dark-mode class names (`dark:*`, `data-theme=dark`, etc.) appear in any file touched by this slice.
- **SC-021**: The deployed Vercel preview renders all five `/problems/[slug]` routes identically to the local production build.

## Assumptions

- **Anonymous-access surface**: Sample report pages are public by design — no authentication, no rate limiting, no `noindex` on the five shippable slugs. The page is a deep-link surface; the marketing site's `TopNav` does not need an active-state item for `/problems` routes.
- **Stub slug alignment with slice-004 seed (3 of 4 stubs)**: Three of the four stub slugs match the slice-004 `packages/db/src/seed.ts` seed verbatim — `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m` — and the slice-012 data store reuses each stub's seeded title, momentum, sources array, and last-seen date for parity with the slice-005 landing cards. These three stubs are the link-flip targets: their landing-card hrefs are already pointing at `/problems/{slug}` and flip from soft-404 to live with zero edits to slice-005 files.
- **Fourth stub is slice-012-local (`webhook-ordering-on-retries`)**: A fourth stub ships exclusively to back the topically-coherent first item of the Stripe RelatedProblemsCard. Its slug `webhook-ordering-on-retries` and title "Webhook ordering on retries" mirror the design's literal first-related-item text. Its breadcrumb is ["Library", "Devtools", "Payments"] (same column as the Stripe full problem). Its lead is the placeholder sentence: *"Two webhooks fire in close succession, the retry queue interleaves them, and the second one races the first. We've seen this break idempotency in two distinct ways."* Its momentum, first-seen date, source badges, quote count, and source count are synthesized placeholder values consistent in shape with the other three stubs. It has no landing-card link; it is reached only via the Stripe page's RelatedProblemsCard. It is NOT in the slice-004 DB seed and is NOT expected to be added to that seed by this slice.
- **Full-report slug alignment with slice-004 seed**: The full slug is `stripe-webhooks-vercel-cold-starts` (matching the slice-004 seed exactly, not the longer `-fail-silently-` variant that appeared in the kick-off message). The full title is "Stripe webhooks fail silently on Vercel cold starts" with no trailing period.
- **Hero link asymmetry on the landing page**: The slice-005 `Hero` renders the Stripe problem via `ProblemCardFull`, which does not accept an `href`. The full Stripe detail page is therefore a direct-URL surface — reachable from outside (search engines, social shares, the in-this-slice RelatedProblemsCard links) but not from the landing chrome itself. Wiring the hero card to the detail page is deferred to a future polish slice.
- **Pull-quote component duplication**: The slice-010 `InlinePullQuote` (under `apps/web/src/components/blog/`) takes prop shape `{ quote: { text, attribution? } }` and visually matches the design's pull-quote treatment. Slice 012 ships a near-duplicate `ProblemPullQuote` page-local under `apps/web/src/components/problem/` rather than extracting a shared component, because extraction would require touching `packages/ui/` and violate the slice-integrity rule (SC-018). A later refactor slice may consolidate the two.
- **Save / Share button inertness**: The hero `Save` and `Share` buttons render as presentational `<button type="button">` with no `onClick`, no client state, and no persistence. This preserves design parity and the single-client-island discipline; real Save (account-bound library) and Share (URL copy / OG card) are owned by the app/onboarding tier.
- **Source badges count**: The hero meta row displays five source badges; the meta text "6 sources" reflects the full source count. No "+N more" overflow indicator is rendered.
- **RelatedProblemsCard list size — RESOLVED**: The card lists exactly four related items, one for each of the four stub slugs (`webhook-ordering-on-retries`, `llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`). No duplicate links, no placeholder hrefs. The first item (`webhook-ordering-on-retries`) is topically coherent with the Stripe full problem; the other three items cover unrelated territory and ship as a documented placeholder shape — founder edits the related-problems list during pre-launch review for thematic coherence.
- **Evidence count mismatch**: The hero meta and evidence headline both claim "47 quotes" while only seven quote records (five visible + two blurred) ship in the data store. This is the accepted "placeholder shape" for v1.0 — the higher number is a UX claim, the lower number is shippable content, and founder review reconciles before production launch.
- **Donut chart construction**: The donut is a hand-rolled SVG with four `<path>` segments rendered via cumulative-angle polar-to-cartesian conversion. The donut inner/outer radius ratio is approximately 0.65. All fills resolve through Tailwind token utilities; no inline hex.
- **Frequency-data shape**: Four windowed datasets ship pre-bundled. Each `7d`, `30d`, `90d` window samples points from the same underlying 60-day series; `all` is the full 60-day series. Numbers rise from ~1–3/day in February to ~8–12/day in May to be consistent with the "+312% MoM" headline.
- **Blurred treatment**: Evidence preview cards apply Tailwind `blur-sm` to the quote text only; the author/source/upvote row stays sharp. This is the "you can see something is here but not read it" UX signal.
- **Breadcrumb separator**: The breadcrumb is rendered as plain " / " literal text matching the design exactly; no SVG separator icon and no `›` glyph.
- **Soft-404 CTAs**: `/signup` is a known carry-forward soft-404 owned by the auth tier. CTAs that link to it ship as-is in this slice; auth-tier slices will replace the destination.
- **Single client island**: Exactly one file under `apps/web/src/components/problem/` carries `"use client"` (`frequency-chart.tsx`); every other component is a Server Component.
