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
- **Auth — Auth.js v5 (`next-auth@5`).** Credentials (email/password) in v1.0 via `@auth/drizzle-adapter` over the existing Supabase Postgres; passwords hashed with `@node-rs/argon2` (argon2id). Google/GitHub OAuth deferred to a later micro-slice (the `accounts` table is provisioned so it is non-breaking). **No SSO/SAML in v1.0.** (Changed from Supabase Auth in slice 013 — maturity decision; exact versions are pinned in `apps/web/package.json`. Supabase Postgres, Drizzle, and Resend are unchanged.)
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
`specs/014-auth-fidelity/plan.md`
<!-- SPECKIT END -->
