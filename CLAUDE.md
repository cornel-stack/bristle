# Bristle — Project Constitution

> This file auto-loads in every Claude Code session. It is the standing law of the project. The slice-by-slice source of truth is `docs/Bristle-Build-Plan.pdf`; the visual contract is the six PDFs in `design/` plus `docs/Bristle-Design-Brief.docx`. When this file and a spec disagree, the spec wins for that slice — but raise the conflict first.

---

## 1. Product mission

Bristle is a multi-source problem-discovery platform that helps builders find problems worth solving — with evidence, not vibes. It ingests technical and product complaints from Hacker News, GitHub Issues, Stack Overflow, Product Hunt, the Apple App Store, and Google Play, clusters duplicates, and synthesizes each cluster into an evidence-backed problem report ranked by frequency, momentum, and willingness-to-pay signals. Each report is treated as an editorial artifact — a research-journal entry, not a chart-and-numbers dump. Bristle is **not** an idea-database of curated guesses, not a keyword-alert mention stream, not a search-volume trend tool, and not "AI-native" in any visible chatbot sense. The machine learning is substrate; the product reads like a journal and operates like a Linear-grade tool.

## 2. Target user

The primary persona is the bootstrapped indie SaaS founder or devtool builder — solo or two-person, technically capable, between projects or pre-product-market-fit, already paying for two-to-four micro-SaaS tools, and willing to spend $29–$79/month on anything that compresses research time. They decide within a week of signing up. The secondary persona is the agency strategist / innovation-lab scout ($199–$499/month) who needs export, share, and team features. This shapes every decision: default to **clarity over density**, respect that this user reads carefully and distrusts hype, surface evidence beside every claim, and never make them click through marketing fluff to reach signal. When a tradeoff appears, choose the option that helps a skeptical technical builder decide whether a problem is real and worth building against.

## 3. Tech stack

Locked decisions. Do not introduce alternatives without proposing the addition first (see §9).

- **Monorepo — Turborepo.** `apps/web` (Next.js 15 App Router), `apps/pipeline` (Python FastAPI), and shared `packages/ui`, `packages/db`, `packages/shared`. One repo, one CI graph, shared types across the web/db boundary.
- **Frontend — Next.js 15 (App Router).** Server Components first; the editorial, mostly-read product benefits from server rendering and small client bundles.
- **TypeScript, strict mode.** Type safety is non-negotiable across the web/db/shared boundary.
- **Tailwind v4.** All Bristle tokens (§4) codified as CSS custom properties; utility classes only.
- **shadcn/ui, customized to Bristle tokens.** Primitive layer we own and restyle — not used stock.
- **lucide-react icons.** Single icon set, 1.5px stroke, functional only.
- **next-themes.** Editorial Light / Editorial Dark switching with no flash.
- **Database — Supabase Postgres + pgvector.** Managed Postgres; pgvector holds embeddings for clustering and semantic nearest-neighbor joins.
- **Drizzle ORM (not Prisma).** Type-safe, SQL-shaped queries with lightweight migrations; chosen over Prisma for transparency and edge-friendliness.
- **Auth — Auth.js v5 (`next-auth@5`).** Credentials (email/password) via `@auth/drizzle-adapter` over the existing Supabase Postgres; passwords hashed with `@node-rs/argon2` (argon2id). **Google + GitHub OAuth ship in slice 014** — the `providers` array in `apps/web/src/auth.ts` goes from `[]` (slice 013) to `[Google, GitHub]`, and the `accounts` table (provisioned but dormant in slice 013) is now actively written on social sign-in. Google/GitHub are submodules of the already-installed `next-auth`, so no new dependency is added. **SSO/SAML is NOT added in v1.0** — the SSO button renders visibly disabled ("Coming soon — SSO available on Enterprise"); real SSO is a v1.1+ Enterprise feature. (Auth stack changed from Supabase Auth in slice 013 — maturity decision; exact versions are pinned in `apps/web/package.json`. Supabase Postgres, Drizzle, `@node-rs/argon2`, and Resend are unchanged.)
- **Payments — Lemon Squeezy.** Merchant of record; handles VAT/tax so we don't.
- **Email — Resend.** Transactional + digests, with Bristle-voiced templates.
- **Pipeline — Python 3.12 + FastAPI, orchestrated by Inngest.** Ingest/cluster/enrich/synthesize jobs run on a batch cadence (4–6h); Inngest handles scheduling, retries, and fan-out.
- **LLMs.** Claude Haiku for filter classification (complaint / feature-request / wish / bug / noise), OpenAI `text-embedding-3-small` for embeddings, Claude Sonnet for enrichment + synthesis.
- **Hosting.** Vercel (web), Railway (pipeline), Supabase (database).
- **Testing.** Vitest (unit), Playwright (end-to-end).
- **Analytics — PostHog.** Product events + session replay; loaded deferred, never in the initial bundle.
- **Errors — Sentry.** With source maps.

## 4. Design system

Extracted from `docs/Bristle-Design-Brief.docx` §3. This section is referenced constantly during UI work — treat the values as exact. Anchor words: **Editorial Minimalism, Calm Density, Quiet Confidence, Evidence Forward, Warm Neutrality.** No gradients, no glassmorphism, no AI-shimmer, no box shadows in light mode except on overlays.

### 4.1 Color tokens

**Editorial Light (default)**

| Token | Hex | Use |
|---|---|---|
| `surface/canvas` | `#FAFAF7` | Page background, warm paper tone |
| `surface/card` | `#FFFFFF` | Elevated cards, sheets, modals |
| `surface/raised` | `#F4F2EA` | Hovered cards, secondary panels |
| `border/default` | `#E8E6DF` | Standard 1px borders |
| `border/strong` | `#D9D7CE` | Dividers and rules |
| `text/primary` | `#1A1A19` | Body, headings |
| `text/secondary` | `#6B6B65` | Captions, meta, timestamps |
| `text/tertiary` | `#9A9A93` | Disabled, hint text |
| `accent/bristle` | `#C2410C` | Primary brand, key actions, momentum |
| `accent/validated` | `#064E3B` | "High signal" and verified states |
| `status/warning` | `#B45309` | Caution, rate-limit warnings |
| `status/error` | `#991B1B` | Errors and destructive confirmations |
| `status/success` | `#166534` | Save confirmations, paid status |

**Editorial Dark**

| Token | Hex | Use |
|---|---|---|
| `surface/canvas` | `#0F0F0E` | Warm near-black page background |
| `surface/card` | `#1A1A19` | Elevated surfaces |
| `surface/raised` | `#232321` | Hover and secondary panels |
| `border/default` | `#2E2E2A` | Standard borders |
| `border/strong` | `#3A3A35` | Dividers |
| `text/primary` | `#F5F5F0` | Body, headings |
| `text/secondary` | `#A8A89F` | Captions, meta |
| `text/tertiary` | `#6B6B65` | Hint, disabled |
| `accent/bristle` | `#F97316` | Primary brand, brighter for dark |
| `accent/validated` | `#10B981` | Verified, high-signal |
| `status/warning` | `#F59E0B` | Caution, rate-limit warnings (dark variant) |
| `status/error` | `#EF4444` | Errors and destructive confirmations (dark variant) |
| `status/success` | `#10B981` | Save confirmations, paid status (matches `accent/validated`) |

> Reading Mode (third theme) is deferred to v1.1; only Editorial Light and Editorial Dark ship in v1.0.

### 4.1a Category tints

Per-category pill tints for the problem-card category chip. Each category has a paired background + foreground in both themes — low-saturation chips (not saturated fills), warm-compatible with the editorial palette, every fg-on-bg pair meeting WCAG AA. `devtools` is anchored to `accent/bristle`. Added in Slice 003 (design tokens + canonical Problem Card) as the documented source for the 8 `categoryColor` keys.

**Editorial Light** — `category/<name>/{bg,fg}`

| Category | `bg` | `fg` |
|---|---|---|
| `payments` | `#E3F2EB` | `#1F6B47` |
| `devtools` | `#FBE9DC` | `#C2410C` |
| `ai-ml` | `#ECE7F7` | `#5B3C99` |
| `auth-sso` | `#E4EDF9` | `#1F4E8F` |
| `deployment` | `#DFF0EE` | `#0F6E68` |
| `analytics` | `#F6EAD6` | `#8A5512` |
| `mobile` | `#F8E6EC` | `#A12648` |
| `email` | `#E9EBF0` | `#3D4860` |

**Editorial Dark** — `category/<name>/{bg,fg}`

| Category | `bg` | `fg` |
|---|---|---|
| `payments` | `#142E20` | `#6FD79E` |
| `devtools` | `#3A1E10` | `#F97316` |
| `ai-ml` | `#251C3A` | `#B69CE6` |
| `auth-sso` | `#16263F` | `#8FB6E8` |
| `deployment` | `#103230` | `#5FD0C7` |
| `analytics` | `#332710` | `#E0B469` |
| `mobile` | `#34161F` | `#E891A8` |
| `email` | `#1E2230` | `#9FB0CC` |

### 4.2 Typography

Three families, one role each, no exceptions:
- **UI Sans — Inter.** All UI chrome: nav, buttons, form fields, tables, captions.
- **Editorial Serif — Source Serif Pro.** Synthesis paragraphs, blockquotes, problem titles, marketing display. (Brief names GT Alpina as an alternative; Source Serif Pro is the locked choice.)
- **Mono — JetBrains Mono.** Source IDs, permalinks, code references, API docs.

Load Inter + Source Serif Pro + JetBrains Mono via `next/font/google`, subset `latin`, weights 400/500/600/700.

**Scale — 1.25 modular ratio, letter-spacing tightens above 22px.**

| Token | Size / Line | Tracking | Use |
|---|---|---|---|
| `display/xl` | 60 / 64 | -0.025em | Hero headlines |
| `display/lg` | 48 / 56 | -0.022em | Section openers |
| `heading/h1` | 36 / 44 | -0.02em | Page titles |
| `heading/h2` | 28 / 36 | -0.015em | Subsection headings |
| `heading/h3` | 22 / 30 | -0.005em | Card / problem titles |
| `heading/h4` | 18 / 26 | 0 | Inline emphasis |
| `body/lg` (serif) | 18 / 30 | 0 | Synthesis paragraphs |
| `body/md` (sans) | 15 / 24 | 0 | Default UI body |
| `body/sm` (sans) | 13 / 20 | 0.01em | Captions, meta |
| `mono/sm` | 13 / 20 | 0 | Source IDs, codes |

### 4.3 Spacing — 4px base unit, octave scale

Tokens: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.**
Defaults: card padding **24**, grid gap between cards **16**, section-to-section vertical rhythm **64**.

### 4.4 Border radius

- **6px** — buttons
- **8px** — cards
- **12px** — modals (and selectable option cards)
- **999px** — pills and tags

Borders: 1px solid `border/default`. No double borders.
Shadows: `0 1px 2px rgba(0,0,0,0.04)` for resting cards in **dark mode only**; `0 12px 32px rgba(0,0,0,0.12)` for modals.

### 4.5 Motion

- **Default duration: 180ms.** Faster feels instant, slower feels sticky.
- **Easing: `cubic-bezier(0.2, 0, 0, 1)`** (Linear's signature).
- **Hover states: 120ms** color shift only — no scale, no rotate.
- **Celebrations: capped at 400ms,** used only for paid conversions and first-run completion (the success-state checkmark scale-in is the *only* celebratory animation in the product).
- **Page transitions: instant.** Use skeleton loaders for data fetches, never spinners.
- **Reduced motion:** when `prefers-reduced-motion` is set, animations drop to 0ms or become opacity-only.

### 4.6 Iconography

Lucide, **1.5px stroke**, functional never decorative. 16px in body, 20px in navigation. Don't pair an icon with redundant text in a button unless the icon adds semantic meaning.

## 5. Coding conventions

- **TypeScript strict mode.** No `any`. No `@ts-ignore` without an adjacent code comment explaining exactly why.
- **Server Components by default** in Next.js. Reach for Client Components only when interactivity genuinely requires them. Skeletons via Suspense boundaries, not conditional render flags. Colocate data fetching with the consuming component.
- **File naming: kebab-case for files; PascalCase for React component identifiers.** (`problem-card.tsx` exporting `ProblemCard`.)
- **All forms validated with Zod schemas shared between server and client** — define once in `packages/shared`, use on both sides.
- **All database access through Drizzle.** No raw SQL in application code, except inside migrations.
- **Tailwind classes only.** No inline `style`, no styled-components, no CSS modules.
- **Lucide icons only, 1.5px stroke.**
- **No `localStorage` or `sessionStorage`** in artifacts or shared components. Use React state or server-persisted state.
- Performance budgets (from brief §9.2): LCP < 2.5s on mid-range mobile/4G; initial JS < 180KB gzipped; images as AVIF/WebP with `srcset`; PostHog deferred.
- Accessibility: WCAG 2.2 AA is the floor — labeled fields (placeholders never replace labels), `aria-label` on icon buttons, visible focus rings (2px `accent/bristle` + 4px ring), `aria-live` for toasts, full keyboard reach, charts have a toggleable data-table alternative.

## 6. Voice and tone

Bristle's voice is **plain-spoken, technical, slightly dry, occasionally wry.** It does not exclaim. It never congratulates the user for routine actions. No exclamation points. No "amazing," "awesome," or emoji in product microcopy. State the number; let it speak.

Three example contrasts from the brief:

| Right | Wrong |
|---|---|
| `Saved.` | `Awesome! Problem saved to your library 🎉` |
| `Nothing here yet. Pick a category to populate the dashboard.` | `Oops! Looks like your dashboard is empty.` |
| `47 mentions in the last 14 days, up from 12.` | `🚀 Trending hot right now!` |

The shipped designs model this voice (e.g. 404: *"We searched 142,318 problems. None of them were this page."*; 500: *"Something broke on our end. We've been notified."*). Match that register.

## 7. SDD workflow

Every feature is a vertical slice and follows Spec Kit, in order:

1. **`/speckit.specify`** — write the slice spec with checkable acceptance criteria.
2. **`/speckit.plan`** — generate the technical plan; iterate with the **"don't implement yet"** guard phrase until clean.
3. **`/speckit.tasks`** — break the plan into atomic tasks.
4. **`/speckit.implement`** — execute tasks one at a time.

Then: **Deploy** (push to main → green CI → live on Vercel/Railway) → **Gate** (verify acceptance criteria, run E2E if applicable). Each tier ends with a tagged git release. **One commit per task.** If a slice fails its gate, fix it before moving on.

Specs live in `specs/[NNN-slice-name]/spec.md` (e.g. `specs/013-design-tokens/spec.md`). **`docs/Bristle-Build-Plan.pdf` is the source of truth for slice ordering** — 45 slices across 8 tiers (Walking Skeleton → Public Surface → Auth & Onboarding → App with Fixtures → Pipeline + Live Data → Settings/Billing/Delivery → System Pages + Polish → Pre-Launch + Launch). **Do not start the next slice without confirmation that the current one is done.**

Explicit v1.0 deferrals (do not build): SSO/SAML, per-seat overage billing, the full 312-category catalog (ship ~40 curated), the "Bristle's Read" LLM (hardcoded in fixtures for v1.0), Reading Mode (third sepia theme), 7 of 10 integrations (MS Teams/Discord/Linear/Notion/n8n/CSV-export/direct-REST show "Coming v1.1" or join-waitlist), live migration-log streaming, Reddit ingestion, a native mobile app, and real-time WebSocket updates (all updates are batch, 4–6h).

## 8. Repository structure

```
bristle/
├── CLAUDE.md                  # This constitution (auto-loads every session)
├── docs/                      # Read-only project references (see §9)
│   ├── Bristle-Build-Plan.pdf     # 45 slices / 8 tiers — slice-order source of truth
│   └── Bristle-Design-Brief.docx  # Full design-system + page spec source of truth
├── design/                    # Read-only high-fidelity screen PDFs — the visual contract
│   ├── Public_pages.pdf           # Landing, About, Pricing, FAQ, Blog, Sample report, Changelog, Contact, Legal
│   ├── Authentication.pdf         # Sign up, Login, Forgot, Reset, Verify, OAuth callback
│   ├── onboarding.pdf             # Role, Categories, First-run tour
│   ├── Core_app.pdf               # Dashboard, Problem detail, Library, Saved, Alerts, Compare, Command palette
│   ├── User_and_Admin.pdf         # Profile, Billing, Notifications, API Keys, Team, Integrations
│   └── System_pages.pdf           # 404, 500, Maintenance, Success, Indexing, Loading skeletons
├── specs/                     # SDD specs, one dir per slice: [NNN-slice-name]/spec.md + plan.md + tasks.md
├── apps/
│   ├── web/                   # Next.js 15 App Router — the product surface
│   └── pipeline/              # Python 3.12 + FastAPI + Inngest — ingest/cluster/enrich/synthesize
├── packages/
│   ├── ui/                    # shadcn/ui components customized to Bristle tokens
│   ├── db/                    # Drizzle schema, migrations, query helpers
│   └── shared/                # Shared types + Zod schemas used by server and client
└── .claude/commands/          # Spec Kit slash commands
```

> **Product surface — onboarding (slice 015, Tier 3.2)**: `apps/web/src/app/onboarding/{role,categories}` capture each new user's role + watched categories onto `users` (`role`, `role_custom`, `watched_categories`, `onboarding_completed_at`), gated after sign-in by the auth (cookie) + completion-state (page-guard) layers.

> **Product data model — full schema + fixtures (slice 016, Tier 4.1)**: migration `0004` extends `problems` (additive) and adds 15 product tables (`problem_quotes/sources/personas/frequency_points/related`, `existing_solutions`, `wtp_signals`, `categories`, `dashboard_fixtures`, `saved_collections`, `user_saved_problems`, `alert_rules`, `alert_notifications`, `problem_activity_log`, `usage_meters`), seeded with 15 fixture problems via `packages/db/src/seed/*`. **Source convention**: the 5 live source badges + key→badge mapping live in `packages/shared/src/sources.ts` (no Product Hunt / Google Play; SO/SE → one badge, forums → one). **Demo-user convention**: a fixed demo user (`demo@bristle.dev`, deterministic id) owns all user-scoped fixtures; watches the 7 sidebar categories (catalog has 8). **Seed timestamps are `now()`-relative** (re-anchored to a single `SEED_NOW` per run, TF-023) so the demo always reads the design's relative times + a re-seed refreshes them. **Follow-up TF-019**: converge the onboarding 18-slug `watched_categories` array onto the canonical 8-key `categories` catalog before the Tier-5.5 fixtures→live swap.

> **Authenticated app shell (slice 017, Tier 4.2)**: the `/app` route group (`apps/web/src/app/app/layout.tsx`) is the persistent sidebar + top-bar shell every Tier-4 screen (4.3–4.8) reuses; gated by Tier-3 `auth()` + the middleware `/app/:path*` matcher. **Current-user convention**: `getAppUser()` (`apps/web/src/lib/app-user.ts`) is the SINGLE seam resolving *which* user's data to render — the demo user for v1.0, a one-line flip to the session user at Tier 5.5; the demo-email literal lives only there, and every read helper takes its resolved id. Dashboard reads via read-only `packages/db` helpers; the canonical ProblemCard gained a `forum` source icon. **Follow-ups**: TF-021 (re-point dashboard cards from `/problems/[slug]` to the authenticated detail in 4.3); TF-022 (reconcile the card's source vocabulary to the registry — drop `ph`/`gp`, route badge rendering through `resolveBadge` — once the Tier-2 landing card's usage is confirmed safe).

> **Authenticated problem detail (slice 018, Tier 4.3)**: `/app/problems/[slug]` (`apps/web/src/app/app/problems/[slug]/page.tsx`) is the second Tier-4 screen — a Server Component reading `getProblemDetail(slug)` (read-only over the 4.1 fixtures) inside the 4.2 shell; seven swapped-panel tabs (one client island, `?tab=` deep-linked) + a persistent right rail rendered *outside* the island. **Boundary-adapter convention**: `apps/web/src/lib/problem-detail-adapter.ts` is the single place DB rows become view models — the `BADGE_TO_ICON` map + all formatting live there once. **Reuse-vs-wrap (the A2 guard)**: reuse the slice-2.6 presentational leaves that are source-agnostic (`DonutChart`/`SourcesCard`, `ProblemMomentumChip`, `buildLinePath` math) by feeding them adapter output; **never edit a shared `components/problem/` leaf** to fit the DB shape — wrap instead (the detail's evidence rows, source-badge row, related list, and a data-driven frequency chart are new in-app components because the public leaves can't represent `forum`, app-store ratings/WTP, the authenticated link target, or a per-problem caption + threshold marker). Two read-only seam-parameterized helpers added: `getSavedProblemIds` (Save reflects read-only saved-state; the toggle ships in 4.5) + `getProblemActivity` (the Activity tab; `getProblemDetail` omits the activity log). TF-021 is closed (dashboard cards → `/app/problems/[slug]`). The Stripe hero's `problem_activity_log` was topped up to ~5 now-relative events (the design doesn't depict the Activity tab; seed-only, no schema change). **Follow-ups**: TF-022 (above); TF-024 (converge the wrapped leaves onto shared, source-agnostic, DB-shaped leaves once the public surface is safe to change — bundle with TF-022); TF-025 (verify the public `/problems/[slug]` data source — static `SAMPLE_PROBLEMS` vs DB — before the Tier-5.5 fixtures→live swap).

> **Library faceted browse (slice 019, Tier 4.4)**: `/app/library` (`apps/web/src/app/app/library/page.tsx`) is the third Tier-4 screen — a Server Component that reads `searchParams`, reads all 15 fixtures via one read-only helper, then **filters/sorts/counts entirely server-side**. **No `getAppUser`**: the Library is global (all 8 categories, display-only), so it never resolves a user and needs no change at the Tier-5.5 flip — the one Tier-4 read screen with no seam. **URL is the state** (`?category=&source=&momentum=&signal=&q=&sort=&view=`, comma-joined) — deep-linkable, no `localStorage`; thin client islands (search/sort/view-toggle/facet-checkbox/mobile-drawer) only `router.replace` the URL. **Read helper**: `getLibraryProblems()` → `LibraryProblem = Problem + hasWtpSignal + wtpMentionCount + hasExistingSolution + searchText` (the only facet/search inputs not already on the `Problem` row). **Pure engine**: `apps/web/src/lib/library-filter.ts` `filterLibrary(rows, query, now)` is a pure, server-side function (intersection-across-groups + union-within-group; **drill-down** facet counts — a value's count excludes its own group so siblings never zero; `total === results.length`) — unusually **sandbox-testable** via a tsx probe. **Dual view (A1)**: a list/table is primary (page 3) with a `?view=` grid toggle that **reuses the 4.2 `ProblemCardFull` + `toProblemCardProps`** over the same set. Counts are real (no scale literal); the Source facet is the 5 live badges (no PH/Google Play). Reuses `dashboard-sort` + the card adapter + the registry/catalog (no duplication). **Follow-ups**: TF-026 (real pagination / infinite scroll when live data scales the result set past one page — render-all is fine at 15); TF-027 (preserve the query in the auth `callbackUrl` so an anonymous *filtered* deep-link survives the login bounce — currently pathname-only, a Tier-3 middleware change).

> **Saved Kanban (slice 020, Tier 4.5) — the first WRITE slice**: `/app/saved` (`apps/web/src/app/app/saved/page.tsx`) is a Server Component that resolves the `getAppUser()` seam (the board *is* user-scoped — unlike the global Library), reads the board via one read-only helper + the saved usage meter, and hands them to one client island. **Ephemeral write model (the write analogue of the read seam — the convention for 4.6/4.7/4.9)**: the client board (`components/app/saved/saved-board.tsx`) hydrates ONCE from the server into `useState`; every interaction — move card across/within collections, remove (unsave), new collection, rename, add — mutates that in-memory state only. **No DB write, no server action, no storage** (§9.6) — a reload resets to the seeded baseline. The seam stays read-only at v1.0; **Tier 5.5 swaps these transitions for real per-user write server actions (TF-028)**, the write analogue of the read-seam flip. Rationale: the seam resolves every session to the *same* demo user, so real writes would drift one shared demo board for all reviewers. Cross-screen: 4.3's Save reads the DB; ephemeral edits here don't reflect there — both render the seeded truth on load (no cross-route client store). **Read helper**: `getSavedBoard(userId)` → `SavedBoardColumn[] = { collection, problems[] }` (read-only). **Reorganize**: accessible native `<select>` "Move to…" on each card (visible, keyboard-operable — no DnD dependency, A2). **New in-app `SavedCard`** (the shared `ProblemCardCompact` renders a sparkline + quote the Saved card lacks and is a live Tier-2 leaf → wrap, don't edit). Real column counts (3/2/3/1); "28 of 50" is the `usage_meters` literal. **Follow-up**: TF-028 (Tier-5.5: in-memory board transitions → real per-user write server actions).

> **Alerts (slice 021, Tier 4.6) — second write slice**: `/app/alerts` (`apps/web/src/app/app/alerts/page.tsx`) — a Server Component resolving the `getAppUser()` seam (user-scoped rules + feed) → one read-only helper → one client island. **Inherits the 4.5 ephemeral write model verbatim**: `components/app/alerts/alerts-view.tsx` hydrates once, then filter / mark-read / mark-all / toggle-rule / add-rule mutate in-memory `useState` only — **no DB write, no server action, no storage**; reload resets to the seeded baseline (Tier 5.5 → real per-user writes, TF-028). **Settled state dichotomy**: read-only RSC screens (Library) keep deep-linkable filters in URL-params; stateful ephemeral islands (Saved, Alerts) keep transient view-state (the feed type-filter) in `useState` — neither uses storage. **Read helper**: `getAlertsData(userId)` → `{ rules: AlertRule[], notifications: AlertNotificationVM[] }` (notifications left-joined to `problems` for the "Open" slug; null for digest/weekly). Notification feed (grouped Today/Yesterday/Earlier, now-relative TF-023 — no fixed dates) + watch-rules rail (accessible `role="switch"` toggles + fired-count, "New" at 0) + visual-only delivery panel. **New-rule vocabulary (A1)**: 4 types — momentum `>X%`, any-new, weekly-count `>X`, WTP-mentions `>X` (a count, not dollars) — category-scoped, name derived `"<Category> · <condition>"`. Fired-counts are independent rule attributes, NOT a sum of the feed (A2). Rule edit/delete deferred (A3). **Follow-up**: TF-028 (shared with 4.5).

> **Compare (slice 022, Tier 4.7) — a READ slice**: `/app/compare` (`apps/web/src/app/app/compare/page.tsx`) — NOT a write slice. There is no comparisons table (`compare_card` is a JSONB *column*), so a comparison is just a **URL of slugs** (`?compare=slug1,…`, ≤4) — shareable, deep-linkable, RSC-rendered, **no DB write**. Like the global Library, the gate is the layout's `auth()`; the data is global problem data, so **NO `getAppUser`**. **Reuses `getProblemDetail` (≤4×)** — it already returns the problem (with the `compare_card` column) + the relational child rows — so **`packages/db` is untouched** (no new helper). **Compare adapter** (`lib/compare-adapter.ts`) is the single seam (the 4.3 pattern): `ProblemDetail → CompareColumnVM`, **validating `compare_card` via `CompareCardSchema.safeParse` at the boundary**. Grid = 6 **derived quantitative** rows (mentions·60d, sources "X of 5" [5-source delta], WTP count·median, top persona·%, solutions count·direct/adjacent, days-since-first-seen — **all from the relational tables, never `compare_card`**) + the 5 **qualitative scorecards** (value + tone) + **Bristle's Read** (verdict + prose; Best-fit = `verdict==='strongest'`). Add via a picker, remove via × — both mutate `?compare=`. **Share copies the deep-link** (the URL IS the comparison); Save view / Export PDF visual-only. **Entry wiring (A2, sanctioned)**: Saved (4.5) "New comparison" button → `<Link href="/app/compare">`; Library (4.4) the A8-deferred row-checkbox → `?select=` + a leading checkbox column + a "Compare selected" bar → `/app/compare?compare=…` — touches to those slices' OWN components (**shared/public leaves untouched**). Saved/named comparisons = a new table → would **STOP** (out of scope; 5.5+).

> **Command palette (slice 023, Tier 4.8)**: the global ⌘K palette (`components/app/command-palette/command-palette.tsx`), mounted once in the gated shell layout — works from any `/app` page; `getAppUser`/`auth()` gate via the shell. **First Tier-4 dependency — `cmdk` (A1), the principled exception**: the standing rule (now the test for future dep calls) is *hand-roll presentational widgets (charts, donuts, tables, the Move-menu) where a11y risk is low; reach for a vetted primitive for an a11y-CRITICAL interactive widget* — a command palette is a combobox + grouped listbox + active-descendant (the canonical ARIA pattern that ships subtly wrong hand-rolled). cmdk is headless → **styled 100% with our tokens**. (A date picker / rich-text editor would qualify under this rule; a chart never will.) **A navigator, never a write**: every selection/shortcut is a `router.push` (problem → detail, category → `?category=`, compare ⌘C/`\` → `?compare=`, **save ⌘S → the detail** where the ephemeral save lives — A2); the Actions group items are navigations (Search Library, Open filtered category, Create alert → `/app/alerts`). We own the substring filter (`shouldFilter={false}` → grouping + the footer count), the overlay (`role="dialog"` focus-trap / Esc / focus-return), and the shortcuts; cmdk owns the listbox a11y. **Read helper**: `getCommandIndex()` → the real 15 problems (slim) + 8 categories (with counts) — no write. **Trigger decoupling**: the topbar "Search…" button dispatches a `bristle:open-command` window event the palette listens for (no context provider). **Sanctioned shell touch**: `app/app/layout.tsx` (mount) + `app-topbar.tsx` (trigger) — the shell's OWN components (shared/public leaves untouched). No schema/seed; no localStorage. Custom categories (4.9) extend the index later.

> **Add custom category (slice 024, Tier 4.8/4.9) — the third ephemeral write, first CROSS-ROUTE**: the dashboard "+ Add category" modal appends an ephemeral custom category that must show up in the **sidebar** (shell), the **alert filter** (`/app/alerts`), and the **palette** (shell) the same session — a reach the per-page ephemeral state of 4.5/4.6 can't make. **Mechanism (A1) — a shell-level `CategoriesContext`** (`components/app/categories/categories-context.tsx`, `"use client"`): mounted in `app/app/layout.tsx`, seeded on load from data the layout already fetches (`getCommandIndex().categories` for the 8 + counts, `watched` flag from `getWatchedCategories(user.id)` keys — **no new `packages/db` helper**); `addCategory({name,keywords,sources})` derives a de-duped slug key and appends `{count:0, watched:true, isCustom:true}`; reload re-seeds from the server → the custom one vanishes. **No DB write, no server action, no localStorage, no schema/seed/migration** (A3 — `is_custom`/`created_by_user_id` exist, dormant), **no new dep**. Tier 5.5 swaps it for a real insert + server-fetched list (**TF-028**, now covering all three write slices). **Consumers (A2, all in-app, read the context, shared/public leaves untouched)**: sidebar (the one server→client conversion — a small `sidebar-categories.tsx` consumer; `AppSidebar` drops its threaded `categories` prop), alert-form `<select>`, palette Categories group (keeps `index` for problems). **Disclosed +1 component** (the slice-015 `constants.ts` pattern): the button is its own `add-category-button.tsx` client island rather than inlined — `header-actions.tsx` stays a server component (inlining would force `"use client"` onto it). **A4** edit/delete deferred (an ephemeral category vanishes on reload → edit/delete would be theater). **A5** a custom key is non-canonical, so its chip falls through `CategoryChip`'s neutral `surface-raised`/`text-secondary` fallback — it never borrows a canonical §4.1a tint. **Batch-0 ordering note**: routing the three consumers through one context unifies three previously-independent orderings (sidebar=demo watch-array order, palette=catalog `position`, alert-form=`CATEGORY_LABELS`) onto one — catalog `position` (the column built to order categories app-wide). Set/labels/counts/watched-flags are byte-identical to before; the sidebar's watched list re-orders to canonical `position` (probe-confirmed: same 7 + same counts, `SAME ORDER: false`). This is the one unavoidable, principled consequence of the consolidation, not a regression.

## 9. Critical "never do this" rules

1. **Never modify files in `design/`.** They are read-only references — the visual contract.
2. **Never modify `docs/Bristle-Build-Plan.pdf` or `docs/Bristle-Design-Brief.docx`.** Read-only sources of truth.
3. **Never skip the spec/plan steps and jump to implementation.** `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`, every time.
4. **Never invent features that aren't in the current slice's spec.** Build exactly the slice in front of you.
5. **Never use a library not listed in §3 without proposing the addition first** and getting agreement.
6. **Never write to `localStorage` or `sessionStorage`.**
7. **Never use "amazing," "awesome," or emoji in product microcopy.** No exclamation points.

## 10. How to handle ambiguity

When a spec is unclear, or the design PDFs don't cover a state you need to build (an error variant, an edge case, a token that isn't defined — e.g. Reading Mode theme tokens), **stop and ask before guessing.** Cite the exact reference: filename and page number — for example, *"`design/Core_app.pdf` page 2 shows the Problem Detail populated state but not the <3-quotes empty state; the brief §5.4.2 says such clusters shouldn't render as pages at all — confirm we hide them?"* Prefer a precise question with the relevant PDF page over a plausible invention. The build plan and design brief are detailed; when they're silent, that silence is a decision point for the user, not for you.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/024-category/plan.md`
<!-- SPECKIT END -->
