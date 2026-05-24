# Implementation Plan: Legal template + four legal pages

**Branch**: `009-legal-pages` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-legal-pages/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Ship the four legal pages — `/terms`, `/privacy`, `/security`, `/gdpr` — completing the originally-enumerated build-plan slice "2.3 About + Contact + Legal" (slice 008 was part 1). Each route is a thin async Server Component that imports its content data file and passes it into a single shared `LegalLayout` Server Component, which composes `TopNav` (reused) + `LegalHero` (eyebrow + serif headline + last-updated caption) + 2-column body wrapping `TocRail` (the only client component) + 10 `LegalSection`s + `SiteFooter` (reused). The `TocRail` structurally mirrors slice-006's `FaqScrollSpyRail` (rootMargin `-80px 0px -55% 0px`, threshold 0, topmost-visible resolution with no-flicker discipline, `<nav aria-label>` + `<a aria-current="location">` current-location pattern, reduced-motion short-circuit, mobile pill auto-scroll-into-view) — **additive only, no edit to slice-006's rail file**; a tracked follow-up dedupes both into a shared `SectionScrollSpyRail` in a future refactor slice. The four content data files (`terms-content.ts`, `privacy-content.ts`, `security-content.ts`, `gdpr-content.ts`) each export one typed `LegalContent` constant per the shared shape in a new `apps/web/src/components/legal/types.ts`. Every content data file carries the `[PLACEHOLDER — legal review needed before production launch]` header; `[REVIEW: ...]` markers in source live in an optional `reviewNote?` field on the section type and **never render to the user-visible page** (the `LegalSection` component renders only `paragraphs`). The four routes were "known out-of-scope 404s" in the slice-005 footer Legal column — both `site-footer.tsx` and the four `href` values are unchanged this slice; the links flip from 404 to live the moment slice 009 ships. **Zero new top-level dependencies, zero DB schema change, zero edits to any shipped slice file** (FR-025, FR-026).

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.
**Primary Dependencies**: existing — `@bristle/shared` (`SITE_URL` consumed by all four route metadata exports), Tailwind v4, `next/font/google`, `lucide-react@1.16.0` (existing; not consumed this slice unless added for a mobile-pill chevron — see decision §9), `@radix-ui/react-accordion` (slice 006, unused this slice), `resend` + `zod` (slice 008, unused this slice). **No new runtime dep.** The `TocRail` is hand-rolled `IntersectionObserver` per slice-006 precedent (no scroll-spy library).
**Storage**: N/A — all four pages are content-static. No schema change, no new query helper, no `@bristle/db` touch.
**Testing**: gates only (typecheck/lint/build, greps, route 200 + meta-tag curl, bundle budgets, deep-link anchor check, mobile-pill auto-scroll walk). No Vitest/Playwright wired (same as slices 005 / 006 / 007 / 008). Server Action testable in principle via Vitest — N/A here (no Server Action).
**Target Platform**: Web (Vercel preview + production).
**Performance Goals (binding, §5)**: Lighthouse ≥90 Performance/Accessibility/Best-Practices on all four legal routes; First-Load JS < 180 KB gz **per route**; SEO 100 on local-prod (SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact and not a regression).
**Constraints**: zero hex literals, zero font-family literals in any new file; voice §6 (no `!`, no emoji, no "amazing/awesome") on all visible prose; no `localStorage`; WCAG 2.2 AA — semantic headings (h1 in `LegalHero`, h2 per numbered section), `<nav aria-label>` wrap on TocRail, `aria-current="location"` on active anchor, focus rings visible; only the `TocRail` carries `"use client"` — all other new components are Server Components or server-only modules.
**Scale/Scope**: 4 new routes (all new — no prior soft-404 stubs to replace), 4 new server components (`LegalLayout`, `LegalHero`, `LegalSection`, plus the four routes), 1 new client component (`TocRail`), 1 shared type module (`types.ts`), 4 content/data files. ~13 new files; 0 new top-level deps; 0 edits to existing-on-main files (additive only — even the slice-005 footer hrefs already point at these routes, no edit needed per FR-025).

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | No new dependency. Existing locked stack unchanged. `IntersectionObserver` is a platform API, not a library. `aria-current="location"` is a W3C ARIA attribute (slice-006 precedent confirmed it as the right navigation pattern after the role="tablist" → current-location nav semantic fix). |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens; TocRail active-state visual treatment is `border-l-2 border-accent-bristle` (desktop vertical rail) and `bg-text-primary text-surface-card` (mobile pill) — same tokens as slice-006 FAQ rail. Zero hex literals, zero font-family literals (SC-021). |
| §5 Conventions + floors | PASS | Server Components default; client surface = **one** named file (`toc-rail.tsx`); kebab-case files / PascalCase components; Tailwind only; no `localStorage`; voice rules applied to all visible prose (`[REVIEW: ...]` markers live in `reviewNote?` field and never render — see decision §3 below); perf/a11y floors explicit (SC-016, SC-017); WCAG 2.2 AA via semantic headings + `aria-current="location"` + focus rings; reduced-motion respected in TocRail scroll behavior. |
| §6 Voice | PASS | All visible prose authored to voice (plain-spoken, no `!`/emoji/hype). Em-dashes are punctuation, not exclamations. The `[REVIEW: ...]` markers live in `reviewNote?` strings that are **never rendered to the user-visible page** (FR-018) — they're developer-facing comments exposed only via source, PR description, and the pre-launch review checklist. Voice grep clean on the rendered output (SC-021). |
| §8 Repo structure | PASS | Page-local section components under `apps/web/src/components/legal/` (new directory; mirrors slice-005 `landing/`, slice-006 `pricing/`/`faq/`, slice-008 `about/`/`contact/`). Content data colocated with consumers. Four route files at `apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx`. No `lib/` change (no new infra module this slice). |
| §9 Never-do | PASS | No edits to `design/`, no edits to PDFs/docs; spec→plan→tasks→implement honored; building exactly the spec; **slice-005 nav and footer untouched** (FR-025 — footer Legal column hrefs already point at all four routes; verified via grep at plan time); **slice-006 pricing/FAQ untouched** (including `FaqScrollSpyRail` — TocRail is a structural mirror in a separate file, not a refactor); **slice-008 about/contact untouched**; no `localStorage`. The four new routes are brand-new (no wholesale replacement of an existing route, unlike slice 008's `/about` or slice 006's `/pricing`). |
| §10 Ambiguity | PASS | All 7 clarifications resolved in the spec (mobile pill row, desktop sticky, fixed dates, OG reuse, TocRail naming, h1+h2 heading levels, reviewNote field rendering discipline). |

**Result**: PASS. Zero new top-level dependencies, zero edits to shipped slices. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)
```text
specs/009-legal-pages/
├── spec.md            # done (all 7 clarifications resolved)
├── plan.md            # this file
├── research.md        # Phase 0 — the 14 decisions
├── contracts/
│   └── ui-and-db.md   # Phase 1 — content-data shapes inline + LegalContent type + TocRail signature + route metadata shape
├── quickstart.md      # Phase 1 — gate recipe + SC mapping
├── checklists/
│   └── requirements.md  # passing
└── tasks.md           # Phase 2 — NOT created here
```

No `data-model.md` (per user direction — no schema change, no new DB shape; content-data shapes documented inline in `contracts/ui-and-db.md` instead).

### Source Code (exact file tree of additions)
```text
apps/web/src/
├── app/
│   ├── terms/
│   │   └── page.tsx                              # ADD — async Server Component, thin wrapper
│   ├── privacy/
│   │   └── page.tsx                              # ADD — async Server Component, thin wrapper
│   ├── security/
│   │   └── page.tsx                              # ADD — async Server Component, thin wrapper
│   └── gdpr/
│       └── page.tsx                              # ADD — async Server Component, thin wrapper
└── components/
    └── legal/
        ├── types.ts                              # ADD — LegalContent shape + TocItem projection
        ├── terms-content.ts                      # ADD — Terms LegalContent (10 sections, [PLACEHOLDER] header)
        ├── privacy-content.ts                    # ADD — Privacy LegalContent (10 sections, [PLACEHOLDER] header)
        ├── security-content.ts                   # ADD — Security LegalContent (10 sections, no `effective` date)
        ├── gdpr-content.ts                       # ADD — GDPR LegalContent (10 sections, no `effective` date)
        ├── legal-hero.tsx                        # ADD — server component (eyebrow + headline + caption)
        ├── legal-section.tsx                     # ADD — server component (numbered <section> with h2 + paragraphs; renders ONLY paragraphs, never reviewNote)
        ├── toc-rail.tsx                          # ADD — client component ("use client", IntersectionObserver, current-location nav pattern)
        └── legal-layout.tsx                      # ADD — server component (TopNav + LegalHero + 2-col body wrapping TocRail + sections + SiteFooter)
```

**Zero modifications to existing-on-main files.** The slice-005 footer's Legal column hrefs already point at `/terms` / `/privacy` / `/security` / `/gdpr`; the routes go live the moment slice 009 ships (FR-025, SC-014). Confirmed via grep at plan time:

```
$ grep -n '/terms\|/privacy\|/security\|/gdpr' apps/web/src/components/landing/site-footer.tsx
33:      { label: "Terms", href: "/terms" },
34:      { label: "Privacy", href: "/privacy" },
35:      { label: "Security", href: "/security" },
36:      { label: "GDPR", href: "/gdpr" },
```

**Structure Decision**: page-local section components under `apps/web/src/components/legal/` mirrors slice-005's `landing/`, slice-006's `pricing/` / `faq/`, and slice-008's `about/` / `contact/` precedents. The four route files at `apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx` follow Next.js App Router conventions. No tokens, problem cards, DB helpers, FAQ rail, About sections, or Contact form touched.

---

## The 14 required decisions

### 1. Composition — **confirmed: four thin async Server Component routes + one shared LegalLayout**

Four routes, each a 1-screen-of-code file:

```tsx
// apps/web/src/app/terms/page.tsx (sketch)
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { LegalLayout } from "@/components/legal/legal-layout";
import { TERMS_CONTENT } from "@/components/legal/terms-content";

export const metadata: Metadata = { /* per decision §10 */ };
export default async function Terms() { return <LegalLayout content={TERMS_CONTENT} />; }
```

Same shape for `/privacy`, `/security`, `/gdpr` — only the imported content constant + the title/description strings differ.

`LegalLayout` owns the page structure:
`<TopNav/>` *(reused)* → `<main>` containing `<LegalHero hero={content.hero}/>` → 2-column grid wrapping `<TocRail items={tocItems}/>` (derived from `content.sections`) + `<div>{content.sections.map(s => <LegalSection key={s.id} section={s}/>)}</div>` `</main>` → `<SiteFooter/>` *(reused)*.

**Rationale**: maps 1:1 to spec sections + per-section 4px gate (for the Terms reference); minimal duplication across the four route files (each is ~10 lines); the `LegalLayout` is the single place where the page chrome lives so future template tweaks (e.g. add a "back to all legal" breadcrumb) land once and cover all four routes.

**Alternatives considered**:
- Single `/legal/[slug]/page.tsx` dynamic route (rejected — Next.js prefers explicit routes for static content with stable URLs; dynamic route adds catch-all overhead and slightly less-trivial static generation; explicit routes keep `git grep "/terms"` working as expected; matches the existing structure of `/about`, `/contact`, etc.).
- Compose the layout inline in each `page.tsx` (rejected — four-fold duplication, template tweaks need four edits; the `LegalLayout` Server Component is the textbook "one screen, four routes" abstraction).

### 2. Server vs Client boundary — **confirmed: 1 client file, 8 server/data files**

Only `apps/web/src/components/legal/toc-rail.tsx` carries `"use client"` (it uses `useState`, `useEffect`, and `useRef` for the IntersectionObserver + mobile-pill ref Map).

Every other new file:
- The four route entries (`{terms,privacy,security,gdpr}/page.tsx`) — async Server Components
- `LegalLayout`, `LegalHero`, `LegalSection` — Server Components
- `types.ts` — pure TS module (types only, no runtime)
- Four content data files — pure TS modules (constants, no runtime logic)

**Net: 1 client file, 12 other files.** Per-route bundle expectation: ~108-110 KB First Load JS (baseline + TocRail's ~1-2 KB compiled output). See decision §11.

**Rationale**: same posture as slice-006 (FAQ rail = single client component) and slice-008 (ContactForm = single client component). Server Components render the prose as zero-JS HTML; only the active-section tracking needs client behavior.

### 3. `LegalContent` type location — **confirmed: separate `types.ts`** (your option (b))

`apps/web/src/components/legal/types.ts` exports `LegalContent`, `LegalSectionContent` (the per-section shape), and `TocItem` (the minimal projection the TocRail consumes).

**Rationale**: the four content data files import `LegalContent` to type their constant. If we co-located the type in `legal-layout.tsx`, every content file would transitively import the layout component just to get the type — fine at runtime (Next.js dead-code-eliminates the import) but conceptually noisy. A separate `types.ts` decouples the content shape from the rendering implementation, which sets up the eventual tracked-follow-up shared-rail refactor cleanly: when `SectionScrollSpyRail` lands, both `FaqScrollSpyRail` and `TocRail` reference a shared section-shape type that doesn't drag a rail-specific component import along.

**Alternatives considered**:
- Co-located in `legal-layout.tsx` as exported types (rejected — see rationale above).
- Co-located in `toc-rail.tsx` (rejected — even worse; content data files would import a *client* component just to get the type; might also break the server/client component-import discipline in unexpected ways).
- Inline in each content data file (rejected — duplicates the type definition four times, drifts on edit).

### 4. `LegalContent` shape — **confirmed with `ReadonlyArray` for safety**

```ts
// apps/web/src/components/legal/types.ts (sketch)

export interface LegalHeroContent {
  eyebrow: string;                                  // e.g. "LEGAL"
  headline: string;                                 // e.g. "Terms of Service"
  lastUpdated: {
    posted: string;                                 // e.g. "2026-05-24"
    effective?: string;                             // optional; omitted on Security + GDPR
  };
}

export interface LegalSectionContent {
  id: string;                                       // e.g. "subscriptions-billing" — anchor target + IO marker
  number: number;                                   // e.g. 3
  title: string;                                    // e.g. "Subscriptions & billing"
  paragraphs: ReadonlyArray<string>;                // 1+ verbatim paragraphs; the renderable copy
  reviewNote?: string;                              // [REVIEW: ...] developer-facing note; NEVER rendered (FR-018)
}

export interface LegalContent {
  hero: LegalHeroContent;
  sections: ReadonlyArray<LegalSectionContent>;     // exactly 10 per FR-014
}

export interface TocItem {                          // minimal projection the TocRail consumes
  id: string;
  number: number;
  title: string;
}
```

**Confirmations from your draft**:
- `hero.lastUpdated.effective` is optional (omitted on Security + GDPR — spec §11 + §12).
- `sections[].reviewNote?` is optional; the `LegalSection` component renders **only `section.paragraphs`** to the user-visible output (FR-018).
- `ReadonlyArray<T>` (not plain `T[]`) on `paragraphs` and `sections` so consumers can't accidentally mutate the shipped content; matches the `as const` pattern slices 006-008 used on tier-data / faq-data / about-content / contact-paths.

**Refinement**: added a `TocItem` projection type to avoid passing the full `LegalSectionContent` (with paragraphs + reviewNote) into the TocRail. `LegalLayout` does the projection: `const tocItems: TocItem[] = content.sections.map(s => ({id: s.id, number: s.number, title: s.title}))`. Keeps the TocRail's prop surface tight and the client bundle small (no chance the paragraphs prose leaks into client JSON serialization for hydration).

### 5. `LegalLayout` grid template — **confirmed: `md:grid-cols-[16rem_1fr]` with `md:gap-section`**

```tsx
// apps/web/src/components/legal/legal-layout.tsx (sketch)
<main className="mx-auto max-w-6xl px-grid">
  <LegalHero hero={content.hero} />
  <div className="grid gap-grid pb-section md:grid-cols-[16rem_1fr] md:gap-section">
    <aside className="md:contents">                  {/* contents = hoist children for grid-cols layout */}
      <TocRail items={tocItems} />
    </aside>
    <div className="flex flex-col gap-section">
      {content.sections.map((section) => (
        <LegalSection key={section.id} section={section} />
      ))}
    </div>
  </div>
</main>
```

**Rationale**: matches slice-006 `FaqBody` (`grid md:grid-cols-[16rem_1fr] md:gap-section` per the FAQ rail layout). 16rem ≈ 256px is enough for the longest TOC label ("Limitation of liability" Terms section 8, ~25 chars at body-sm) plus the active accent bar; `gap-section` (64px from the token table) gives the breathing room a long-read article wants.

Wait — re-reading slice-006 `FaqBody`, the layout was:
```tsx
<div className="grid gap-grid md:grid-cols-[16rem_1fr] md:gap-section">
  <div>
    <FaqScrollSpyRail />
    <div className="hidden md:mt-card md:block"><StillStuckCard /></div>
  </div>
  <div><FaqAccordion /></div>
  <div className="md:hidden"><StillStuckCard /></div>
</div>
```

Slice 009 doesn't have a Still-Stuck card — the TocRail is the only thing in the left column. Simpler:

```tsx
<div className="grid gap-grid md:grid-cols-[16rem_1fr] md:gap-section">
  <TocRail items={tocItems} />
  <div className="flex flex-col gap-section">
    {content.sections.map((section) => <LegalSection key={section.id} section={section} />)}
  </div>
</div>
```

`TocRail` renders its own desktop sticky + mobile pill row switch internally (per slice-006 precedent). On mobile, the grid collapses to single column; the TocRail renders its horizontal pill row at the top (its `md:hidden` half), the sections render below.

**Alternative considered**: `md:grid-cols-[14rem_1fr]` (narrower rail). Rejected — "Limitation of liability" at 14rem would wrap to 2 lines at body-sm, which makes the active-state visual cue less clear. 16rem matches FAQ rail and accommodates the longest legal labels comfortably.

### 6. TocRail IntersectionObserver config — **confirmed: structural mirror of slice-006 FAQ rail**

```ts
// Verbatim from slice-006 scroll-spy-rail.tsx (FR-008):
{ rootMargin: "-80px 0px -55% 0px", threshold: 0 }
```

- **`rootMargin: "-80px 0px -55% 0px"`** — top inset 80px (clears the visible TopNav so a section scrolled "behind" the nav doesn't count as visible); bottom inset 55% (biases active state to upper-middle of viewport; long sections at the top don't flip active the moment they barely peek above the bottom edge).
- **`threshold: 0`** — fire on any intersection so we always have current `boundingClientRect.top` values to compare.
- **Topmost-visible resolution**: `Map<itemId, topY>` ref updated by the observer callback (set when `isIntersecting`, delete when not); after each batch of entries, linear scan for the smallest `topY` → that's the topmost intersecting section → its `id` becomes the new `active` state.
- **No-intersection branch**: when `visibleItems.size === 0` (visitor scrolled between two sections), the function early-returns without setting `active` — previous value is preserved, no flicker.

**Selector**: `document.querySelectorAll<HTMLElement>("[data-legal-section]")`. The `LegalSection` component renders `<section id="{id}" data-legal-section="{id}">` (per FR-005) — the `id` is the anchor target, `data-legal-section` is the IO query marker. **Distinct from slice-006's `[data-faq-item]`** so the two rails don't accidentally observe each other's content if they ever co-exist on a page (they won't this slice, but the discipline is cheap).

**Initial `active` state**: the first section in the list (`content.sections[0].id`, e.g. `"overview"` for all four legal pages). Visitor lands on the page, sees the overview section at the top, and the rail's first item is already highlighted before the IO fires.

**Rationale**: same as slice-006 — the config is the result of two slices of iteration (slice 006's STOP 2 / 3 cycle) and shouldn't be re-derived from scratch. The structural mirror is **intentional** per FR-008; the tracked follow-up (decision §13) captures the eventual dedupe into a shared `SectionScrollSpyRail`.

**Alternatives considered**:
- Cache-bust the IO config per slice (rejected — the slice-006 values are well-tuned for the same use case; re-deriving from scratch would risk regressing the smoothness slice 006 achieved).
- Different selector strategy (rejected — `[data-legal-section]` is the simplest scoped marker; `[data-faq-item]` precedent shows it works at runtime + survives section reordering).

### 7. ARIA semantic pattern — **confirmed: current-location nav (NOT tablist)**

```tsx
<nav aria-label="Sections of the page">
  <ul>
    {items.map((item) => (
      <li key={item.id}>
        <a
          href={`#${item.id}`}
          aria-current={item.id === active ? "location" : undefined}
          onClick={(e) => handleClick(e, item.id)}
        >
          {item.number}. {item.title}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

Per the slice-006 STOP-2 semantic correction (where we removed `role="tablist"` / `role="tab"` / `aria-selected` because the FAQ rail wasn't actually implementing the W3C tabs interaction model). The legal-pages TocRail is the same shape: it's navigation that scroll-jumps to anchored sections, NOT a tabs UI where activating a "tab" replaces content. So:
- `<nav aria-label="Sections of the page">` — single nav landmark per page; the label distinguishes it from the top-nav.
- `<a href="#{id}">` — standard anchors, not buttons. Native browser features (Cmd-click new tab, middle-click, back button, keyboard activation) work for free; the JS handler only intercepts plain-click for the smooth-scroll behavior.
- `aria-current="location"` on the active anchor; **omitted** (not `false` or empty string) on non-active anchors. Screen readers announce "current location" when the active anchor receives focus.
- **NO** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, or `aria-orientation` — those imply behaviors (W3C tabs pattern with roving tabindex, keyboard-arrow navigation between tabs, controlled tabpanel reveal) that this rail does not provide.

**Rationale**: the slice-006 STOP-2 correction set the precedent — the user explicitly asked for the semantic fix on the FAQ rail; the legal-pages TocRail must inherit the corrected pattern from day one rather than ship the incorrect one and "fix it later". Same trust posture as slice 008's `<main>` landmark addition (got it from day one on `/about` + `/contact`).

### 8. Reduced-motion short-circuit — **confirmed: read fresh per invocation, never cached**

```ts
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function handleClick(e, sectionId) {
  // ... preventDefault, find target by id ...
  const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

useEffect(() => {                                     // mobile pill auto-scroll, see decision §9
  // ...
  const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
  pill.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
}, [active]);
```

Both call sites read `matchMedia(...).matches` **inside the handler / effect**, not at module scope or component mount. Same pattern as slice-006 FAQ rail (slice-006 plan §7 / decision §D7). Rationale: visitors can toggle their OS reduced-motion preference mid-session (system settings panel) and the next click should respect the new value immediately, with no page reload.

**Alternative considered**: cache the value once with a `useMediaQuery` hook (rejected — adds a dep or a custom hook for negligible benefit; the `matchMedia(...).matches` read is microseconds and runs at most once per click/effect; mid-session toggle is the explicit win).

### 9. Mobile pill auto-scroll-into-view — **confirmed: structural mirror of slice-006 second useEffect**

```ts
const DESKTOP_MQ = "(min-width: 768px)";              // matches Tailwind `md`

useEffect(() => {
  if (window.matchMedia(DESKTOP_MQ).matches) return;  // no-op on desktop; rail is sticky-visible there
  const pill = mobilePillRefs.current.get(active);
  if (!pill) return;
  const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
  pill.scrollIntoView({
    inline: "center",
    block: "nearest",
    behavior: reduce ? "auto" : "smooth",
  });
}, [active]);
```

- **Effect keyed on `active`** so it fires every time the scroll-tracking IO updates which section is the topmost-visible one.
- **Desktop early-return** via `matchMedia("(min-width: 768px)").matches` — the desktop rail is sticky-visible and doesn't need its active item scrolled into view; only the mobile horizontal pill row scrolls.
- **`inline: "center"`** — centers the pill horizontally in its scrollable container, so the visitor always sees the active pill regardless of how many sections precede it.
- **`block: "nearest"`** — doesn't scroll the *page* vertically (the pill row is its own scroll container; the page itself stays where the visitor is reading).
- **Reduced-motion** — same fresh-read per invocation as decision §8.

**Rationale**: verbatim slice-006 pattern (slice-006 `scroll-spy-rail.tsx` lines 80-90). Tracked follow-up captures the eventual dedupe.

### 10. Per-page metadata — **confirmed strings (and propose the four descriptions for your review)**

```ts
// apps/web/src/app/terms/page.tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Terms of Service — Bristle",
  description: "The terms that govern your use of Bristle, including account, billing, cancellation, and liability.",
  openGraph: {
    title: "Terms of Service — Bristle",
    description: "The terms that govern your use of Bristle, including account, billing, cancellation, and liability.",
    type: "website",
    url: SITE_URL + "/terms",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

// apps/web/src/app/privacy/page.tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Privacy Policy — Bristle",
  description: "What data Bristle collects, why we collect it, and the rights you have over it.",
  openGraph: { /* same shape, url = SITE_URL + "/privacy" */ },
};

// apps/web/src/app/security/page.tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Security — Bristle",
  description: "How Bristle protects customer data and how to report security issues.",
  openGraph: { /* same shape, url = SITE_URL + "/security" */ },
};

// apps/web/src/app/gdpr/page.tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GDPR Compliance — Bristle",
  description: "Bristle's specific commitments to EU and UK data subjects under GDPR.",
  openGraph: { /* same shape, url = SITE_URL + "/gdpr" */ },
};
```

- **No `robots` field** on any of the four → all four indexable by default (FR-016).
- **OG image reused** unchanged from slice 005 (`/og-image.png` — 1200×630, deployed) per clarification (d). No new raster this slice.
- **Title format** `Page — Bristle` matches slice 006 (`Pricing — Bristle`, `FAQ — Bristle`) and slice 008 (`About — Bristle`, `Contact — Bristle`).
- **Four description strings** above are implementor-authored to §6 voice (plain-spoken, no `!`, no emoji, single sentence each). **Flag for your review at STOP 1** — if you'd rather adjust any, this is the place. Recommended as-is.

### 11. Performance / SEO budget — **strategy for keeping each route under 180 KB gz**

- **TocRail bundle**: ~1-2 KB compiled (same shape as slice-006 FaqScrollSpyRail which contributes ~1 KB to `/faq`'s 116 KB First Load JS — but the FAQ rail also coexists with the Radix Accordion's ~5 KB which the legal pages don't have). **Expected First Load JS per legal route: ~107-110 KB** (slice-005 baseline ~106 KB + TocRail ~1-2 KB), well under the 180 KB budget.
- **No new font**: `next/font/google` already loads Inter / Source Serif Pro / JetBrains Mono in `apps/web/src/app/layout.tsx`; all four legal pages inherit. No on-page rasters (OG image is metadata-only, never rendered on-page).
- **No analytics on these pages** this slice (PostHog deferred per §3 "loaded deferred"; this slice doesn't introduce it).
- **Content data files are server-only by construction** — they're imported by Server Components only. Next.js dead-code-eliminates any unused symbol from the client bundle; the prose data never reaches the browser as JSON (only the rendered HTML does). **No risk of accidentally bundling the 10×4=40 sections of legal prose as serialized React server-component payloads bigger than necessary** — slice-006 `/faq` baseline (which serializes all 12 FAQ answers via Radix Accordion's controlled state) is 116 KB; legal pages don't have an interactive component reading the prose, so their per-section serialization is lighter.
- **All four routes statically prerendered (`○ Static`)** per FR-023. Verify at T021 via `next build` output.
- **LCP candidate** on each page: the `LegalHero` serif headline (text, server-rendered, font `display:swap` from the root layout). Same pattern as slice-005's `/` (LCP < 2.5s mobile).

### 12. Test surface — **confirmed: gates only; visual diff applies to /terms only**

Same as slices 006 and 008 — no automated test files this slice. Verification is the gate phase:
- typecheck/lint/build (SC-015)
- Lighthouse on each of the four pages (SC-017)
- responsive sweep at 320/375/768/1024/1280/1440 (SC-012)
- keyboard reach + focus rings on TocRail anchors (SC-009, AC US3-6)
- `prefers-reduced-motion` toggle walk (SC-007, AC US3-7)
- deep-link anchor check (`/terms#cancellation-refunds` lands scrolled — AC §Edge Cases)
- hex / font-family / voice greps on all new files (SC-021)
- per-page metadata curl check (titles, descriptions, OG set, no robots) (SC-013)
- **Visual diff vs `design/Public_pages.pdf` page 10 at 1280 width applies to `/terms` only** — the other three routes apply the same template; their visual correctness is **structural** (same `LegalLayout` + components + spacing + TOC behavior), code-reviewed + Lighthouse-checked rather than pixel-diffed against a PDF that doesn't exist (SC-011).
- additive-only check: `git diff --stat origin/main..HEAD` shows zero edits outside `apps/web/src/components/legal/` and `apps/web/src/app/{terms,privacy,security,gdpr}/` (SC-022).

### 13. Risks, unknowns & tracked follow-ups

#### Risks (in-slice)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to `Public_pages.pdf` p.10 for the Terms route (the template reference) | Med | Low | Map every dimension to tokens; screenshot-compare at the design viewport; the LegalHero serif headline + last-updated caption + TocRail accent bar + section h2 numbered titles are the most-likely 4px-tolerance suspects. The other three routes get structural-correctness review only (no PDF to diff against). |
| R2 | The TocRail breaks on a page with sections where one section is extremely long (visitor scrolls within section 5 for 1500px before section 6's marker enters the viewport) | Low | Low | The `Map<itemId, topY>` resolution rule keeps section 5 active throughout — by construction, since it's the topmost intersecting item. The "between sections" no-flicker branch never fires here because section 5's marker stays intersecting throughout the scroll. Tested by slice-006's FAQ rail (same code path, longer Q's like q-1 verbatim). |
| R3 | Deep-link `/terms#cancellation-refunds` arrives before the IntersectionObserver hydrates → active state doesn't match URL hash for ~100ms post-load | Low | Low | The IO is set up in a `useEffect` that runs immediately on hydration (no async dep); the page's native anchor-scroll happens during initial paint; the IO's first callback fires within one rAF tick (~16ms) of that scroll completing. The mismatch window is sub-perceptual. Tested by slice-006 (same pattern). |
| R4 | A reader of the source confuses `[REVIEW: ...]` markers (which should never render) with the actual paragraph copy (which renders verbatim) | Med | High | The `LegalSection` component renders **only `section.paragraphs`** (FR-018). `reviewNote` is a separate optional field on the section type. The TS type makes the distinction explicit; the comment block on each content data file ([PLACEHOLDER] header) reinforces it; the PR description's pre-launch review checklist surfaces every reviewNote verbatim. Verification at T021 via grep that `reviewNote` substrings never appear in rendered HTML output. |
| R5 | A future content edit accidentally drops a `reviewNote` marker without resolving the underlying review item | Med | Med | The pre-launch review checklist in the PR description is the only authoritative list of reviewNotes — a content edit that touches a section with a reviewNote must update the checklist too. This is a *process* mitigation, not a code one; document in the PR template (and surface in the eventual `tasks.md` Batch D T022 verify). |
| R6 | Hidden hex/font-family literal slips into the new files (SC-021) | Med | Med | Grep gate against `apps/web/src/components/legal/` and the four route files for `#[0-9a-f]{3,8}` and `font-family` / `font-name` strings before commit. Same discipline as slices 005-008. |
| R7 | Cross-page links from legal prose hit known-stub/404 surfaces (`/changelog` → slice-005 stub; `/status` → 404 until slice 2.7; `/privacy/sub-processors` → 404 until follow-up) | Confirmed expected behavior | Low | Documented in Assumptions §"Cross-page link integrity" and tracked follow-up. Visitors clicking these informational links land on slice-005 stubs or Next.js 404; not a slice-009 defect. The eventual pre-launch review checklist surfaces all such links so the founder can choose to redact / rephrase / wait. |
| R8 | The implicit refund-policy alignment between Terms section 6 and FAQ q-5 (slice 008) silently drifts on a future edit | Med | High | FR-015 documents the constraint; `[REVIEW: ...]` marker on Terms section 6 in source flags it; the PR description's pre-launch review checklist surfaces it. **Permanent cross-slice integrity constraint**: any future pricing/legal slice that edits one MUST audit the other. Carry as a "tracked follow-up: refund-policy alignment" item in slice-009's plan (below). |
| R9 | First-Load JS for any of the four legal pages exceeds 180 KB gz | Very Low | High | Strict tree-shake discipline (decision §11); T021 verifies. Slice-005 baseline `/blog` stub is 106 KB; the legal pages should land at ~107-110 KB. ≥130 KB would indicate a bundle leak (zod, Radix Accordion, Resend SDK accidentally pulled in) — investigate via grep across `.next/static/chunks/`. |

#### Tracked follow-ups (out of scope this slice, captured here for future-slice authoring)

- **Dedupe `FaqScrollSpyRail` and `TocRail` into a shared `SectionScrollSpyRail`** (carried from spec; reinforced here). Both components share ~80% of the IntersectionObserver + mobile-pill-auto-scroll + reduced-motion logic. A future refactor slice (likely slice 2.7 final wire-up or a separate refactor slice) extracts a shared component parameterised over (a) section-marker selector (e.g. `[data-faq-item]` vs `[data-legal-section]`), (b) section labels source, (c) initial active section. **NOT done in slice 009** — would expand scope from additive-only to refactor and risk regressing the shipped FAQ rail.
- **`/privacy/sub-processors` deep page**. Referenced from Privacy section 5 and GDPR section 6; not built this slice. Follow-up (likely slice 2.7 or a separate sub-processors slice).
- **Refund-policy alignment audit** (R8). Permanent cross-slice integrity constraint — any future pricing/legal slice that edits one of (Terms section 6, FAQ q-5) MUST audit the other.
- **Slice-005 `<main>` landmark** (carried since slice 006 STOP 4) — `apps/web/src/app/page.tsx` lacks `<main>` wrap. Slice 008's two new pages got it from day one; slice 009's four new pages get it from day one (LegalLayout wraps content in `<main>`). Defer the slice-005 one-line fix to a future micro-slice touching landing chrome.
- **NewsletterStub markup duplication** (About + footer) — carried from slice 008; both visual stubs today; slice 2.7 wires both and likely converges to one shared component.
- **Form spam protection** (carried from slice 008) — Cloudflare Turnstile or Vercel KV rate limiting if spam volume warrants.
- **Vitest harness for Server Actions** (carried from slice 008) — N/A for slice 009 (no Server Action this slice).
- **`/api/contact` route handler** (carried from slice 008) — N/A for slice 009.

#### Unknowns

None. The spec has 7 clarifications, all resolved.

### 14. Implementation batching — **confirmed: 4 batches / 4 STOPs, mirroring slices 006 and 008**

- **Batch A / STOP 1 — Foundations** (~5 commits): `types.ts` + four content data files (`terms-content.ts`, `privacy-content.ts`, `security-content.ts`, `gdpr-content.ts`). Verification gate: typecheck/lint + [PLACEHOLDER] headers + section counts (10 per file) + verbatim opening-phrase greps + voice greps clean.
- **Batch B / STOP 2 — Template primitives** (~3 commits, [P]-parallel-eligible): `LegalHero`, `LegalSection`, `TocRail` (the client component). The interactive surface — `TocRail` is where the IO + reduced-motion + mobile-pill auto-scroll logic lives.
- **Batch C / STOP 3 — Shared layout + four routes** (~5 commits): `LegalLayout` (depends on Batch B) + four `page.tsx` files (each depends on `LegalLayout` + its content data file). Assembly.
- **Batch D / STOP 4 — Gates** (no commits): T-local gate (typecheck/lint/build + bundle budgets verified against §11 + Lighthouse + responsive sweep + greps + keyboard reach + reduced-motion walk + deep-link anchor check + visual-diff vs PDF p.10 for `/terms` only + slice-005 footer regression check confirming all four hrefs land live) + T-preview parity gate.

**Expected total: ~13-14 commit-producing tasks + 2 verification gates**. Slightly smaller than slice 008 (~19 commits) because:
- No new dependencies (slice 008 had `resend` + `zod` install commits).
- No `.env.example` (slice 008 had three env vars).
- No interactive form (slice 008 had ContactForm + Server Action + ContactFormSuccess + ContactFormError).
- TocRail is a single client component (slice 008 had ContactForm + the Server Action wiring).

Confirmation of your draft: shape correct. Refinement: noted batch sizes above (Batch A 5, Batch B 3, Batch C 5, Batch D 2 gates).

## Order of operations
1. **Batch A**: `types.ts` → four content data files (per-file commits, [P]-parallel-eligible after `types.ts` lands since each content file imports from it but they're otherwise independent).
2. **Batch B**: `LegalHero` → `LegalSection` → `TocRail` (any order — all three [P]-parallel-eligible; commit per file).
3. **Batch C**: `LegalLayout` → `/terms/page.tsx` → `/privacy/page.tsx` → `/security/page.tsx` → `/gdpr/page.tsx`. The four route files are [P]-parallel-eligible after `LegalLayout` lands (each is independent — different content imports, different metadata strings).
4. **Batch D**: T-local gate (no commit) → push branch → T-preview parity (no commit).

`types.ts` (Batch A first task) gates the whole slice — the content data files can't compile without it. Within Batch C, the four route files all share `LegalLayout` as a dep.

## Complexity Tracking
No constitution violations — section intentionally empty. The TocRail-vs-FAQ-rail structural duplication is recorded above in §13 / tracked follow-ups as a deliberate trade-off (additive-only this slice; refactor in a future slice).
