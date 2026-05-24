# Tasks: Legal template + four legal pages

**Input**: `spec.md` + `plan.md` + `research.md` + `contracts/ui-and-db.md` + `quickstart.md` in `specs/009-legal-pages/`
**Branch**: `009-legal-pages`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slices 005 / 006 / 008). Verification is the gate phase — typecheck/lint/build, First-Load JS budgets, `[PLACEHOLDER]` + verbatim-opening-phrase greps, hex/font/voice greps, route 200 + meta-tag curl, deep-link anchor walk, keyboard reach + reduced-motion walk on TocRail, 4px-tolerance visual-diff vs `Public_pages.pdf` p.10 for `/terms` only (structural correctness for the other three), slice-005 footer regression check, additive-only diff check, and preview parity.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (visitor reads legal pages + navigates sections), US2 (slice-005 footer Legal column flips from 404 to live), US3 (perf/a11y/SEO/voice floors per spec), or SETUP.
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: four batches, each ending in **one STOP** for review (per slice-006 / slice-008 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #7 (slice 008) merged to `main` via merge commit `1f729ba` on 2026-05-24; `009-legal-pages` cut from clean `main` (no stacking); branch is currently 2 commits ahead (spec `715accf` + plan `464a3fb`); working tree clean. Slice-005 footer Company column links `/terms` (line 33), `/privacy` (line 34), `/security` (line 35), `/gdpr` (line 36) — verified at plan time; **no footer edit this slice** (FR-025).
- **Additive-only, zero new deps**: no top-level dependency added (TocRail is hand-rolled `IntersectionObserver` per slice-006 precedent). `pnpm-lock.yaml` MUST remain unchanged. **No edits to slice-005 / slice-006 / slice-008 files** (FR-025, SC-022, SC-023).
- **Boundary reminder**: each of the four `app/{terms,privacy,security,gdpr}/page.tsx` files is an async Server Component; only **one** new file carries `"use client"` — `apps/web/src/components/legal/toc-rail.tsx` (plan §2 / decision §D2). `reviewNote` fields on the `LegalSectionContent` type are **never rendered** to the user-visible page (FR-018 / plan §D7).

---

## Batch A — types + content data files  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] `types.ts` (shared LegalContent + TocItem types)
Create `apps/web/src/components/legal/types.ts` exporting `LegalHeroContent`, `LegalSectionContent`, `LegalContent`, and `TocItem` per plan decisions §3 + §4 / contracts. `LegalSectionContent` includes optional `reviewNote?: string` field. `paragraphs` and `sections` typed as `ReadonlyArray<...>`. `TocItem` is the minimal `{id, number, title}` projection consumed by `TocRail`.
- **Files**: `apps/web/src/components/legal/types.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file exports the four named types; `LegalSectionContent.paragraphs` is `ReadonlyArray<string>`; `LegalContent.sections` is `ReadonlyArray<LegalSectionContent>`; `TocItem` is `{id: string; number: number; title: string}` (no extra fields — keeps the rail prop surface tight).
- **Commit**: `feat(web): add legal/types.ts (LegalContent + TocItem shapes) (slice 009)`

### T002 · [P] [US1] `terms-content.ts` (Terms of Service, 10 sections verbatim)
Create `apps/web/src/components/legal/terms-content.ts` exporting `const TERMS_CONTENT: LegalContent` with the verbatim content from spec §9: hero (`LEGAL` eyebrow, `Terms of Service` headline, `posted: "2026-05-24"` + `effective: "2026-05-24"`), 10 sections in spec §9 order, every paragraph verbatim. Sections with `[REVIEW: ...]` markers in spec carry the verbatim review text in their `reviewNote?` field: section 1 (entity name), section 3 (payment processor), section 6 (refund-policy alignment with FAQ q-5), section 9 (jurisdiction + venue). The file MUST begin with the `// [PLACEHOLDER — legal review needed before production launch]` header comment per FR-013.
- **Files**: `apps/web/src/components/legal/terms-content.ts`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; `TERMS_CONTENT.sections.length === 10`; `head -1` returns the `[PLACEHOLDER — legal review needed before production launch]` comment; section 1 paragraph starts `"These terms govern your use of Bristle"`; section 6 paragraph 2 starts `"Refunds are handled case-by-case."`; 4 sections have `reviewNote` set (1, 3, 6, 9); voice grep on `paragraphs` arrays clean (no `!`/emoji/hype — em-dashes and `'` apostrophes OK).
- **Commit**: `feat(web): add terms-content with 10 sections + 4 reviewNote markers (slice 009)`

### T003 · [P] [US1] `privacy-content.ts` (Privacy Policy, 10 sections verbatim)
Create `apps/web/src/components/legal/privacy-content.ts` exporting `const PRIVACY_CONTENT: LegalContent` with the verbatim content from spec §10: hero (`LEGAL` eyebrow, `Privacy Policy` headline, both dates `2026-05-24`), 10 sections in spec §10 order. Section 5 (Third-party services) is multi-paragraph (3 paragraphs) and carries a `reviewNote` per spec ("confirm each sub-processor when committed to the actual stack"). Header comment as line 1.
- **Files**: `apps/web/src/components/legal/privacy-content.ts`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; `PRIVACY_CONTENT.sections.length === 10`; `head -1` returns the `[PLACEHOLDER]` header; section 1 paragraph starts `"This policy explains what data Bristle collects"`; section 5 has 3 paragraphs in `paragraphs` array; section 5 has `reviewNote`; section 8 paragraph starts `"You can access, correct, export"`; voice grep clean.
- **Commit**: `feat(web): add privacy-content with 10 sections (slice 009)`

### T004 · [P] [US1] `security-content.ts` (Security, 10 sections; **no `effective` date**)
Create `apps/web/src/components/legal/security-content.ts` exporting `const SECURITY_CONTENT: LegalContent` with the verbatim content from spec §11: hero (`LEGAL` eyebrow, `Security` headline, `posted: "2026-05-24"` — `effective` field **OMITTED** per spec §11 note: security is a continuously-updated practice statement, not a contract), 10 sections in spec §11 order. Sections 8 (Vulnerability disclosure) and 9 (Compliance) carry `reviewNote`. Header comment as line 1.
- **Files**: `apps/web/src/components/legal/security-content.ts`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; `SECURITY_CONTENT.sections.length === 10`; `head -1` returns the `[PLACEHOLDER]` header; `SECURITY_CONTENT.hero.lastUpdated.effective === undefined` (or the `effective` key is absent from the object literal); section 4 paragraph starts `"All traffic to and from Bristle is encrypted"`; sections 8 and 9 have `reviewNote`; voice grep clean.
- **Commit**: `feat(web): add security-content with 10 sections (no effective date) (slice 009)`

### T005 · [P] [US1] `gdpr-content.ts` (GDPR Compliance, 10 sections; **no `effective` date**)
Create `apps/web/src/components/legal/gdpr-content.ts` exporting `const GDPR_CONTENT: LegalContent` with the verbatim content from spec §12: hero (`LEGAL` eyebrow, `GDPR Compliance` headline, `posted: "2026-05-24"` — `effective` field **OMITTED**), 10 sections in spec §12 order. Section 2 (Lawful basis) is multi-paragraph (2 paragraphs); section 7 (Data subject rights) is 3 paragraphs. Sections 4 (Data controller), 5 (International transfers), 10 (Contact) carry `reviewNote`. Header comment as line 1.
- **Files**: `apps/web/src/components/legal/gdpr-content.ts`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; `GDPR_CONTENT.sections.length === 10`; `head -1` returns the `[PLACEHOLDER]` header; `effective` field absent or undefined on hero; section 7 paragraph 2 starts `"Right of access (Article 15)"`; sections 4, 5, 10 have `reviewNote`; voice grep clean.
- **Commit**: `feat(web): add gdpr-content with 10 sections (no effective date) (slice 009)`

### T006 · [SETUP] VERIFY — Batch A foundations (gate)
Run the Batch A verification checks.
- **Depends on**: T001, T002, T003, T004, T005
- **Verify**:
  - **Typecheck + lint**: `pnpm typecheck && pnpm lint` exit 0.
  - **PLACEHOLDER headers** (SC-005): `for f in terms privacy security gdpr; do head -1 apps/web/src/components/legal/$f-content.ts; done` — every line is `// [PLACEHOLDER — legal review needed before production launch]`.
  - **Section count** (SC-003 part 1): each content file's `{ id:` count is exactly 10. `grep -c "^[[:space:]]*id:" apps/web/src/components/legal/terms-content.ts` returns `10`; same for privacy / security / gdpr.
  - **Verbatim opening-phrase grep** (SC-004): each of these greps returns at least one hit in the matching file:
    - terms: `"These terms govern your use of Bristle"`
    - privacy: `"This policy explains what data Bristle collects"`
    - security: `"All traffic to and from Bristle is encrypted"`
    - gdpr: `"EU and UK data subjects have the following rights"`
  - **Voice grep on prose** (SC-021): `grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<' apps/web/src/components/legal/*.ts` → zero matches in the four content files (em-dashes OK; reviewNote markers like `[REVIEW: ...]` may contain stronger language but DO NOT contain `!` per spec authoring).
  - **reviewNote fields present**: `grep -c "reviewNote:" apps/web/src/components/legal/terms-content.ts` returns `4`; same grep for privacy returns `1` (section 5); for security returns `2` (sections 8, 9); for gdpr returns `3` (sections 4, 5, 10). Total: 10 reviewNotes across the four files — matches the count of `[REVIEW: ...]` markers in spec §§9-12.
  - **types.ts**: `grep -E "export (interface|type) (LegalHeroContent|LegalSectionContent|LegalContent|TocItem)" apps/web/src/components/legal/types.ts` returns 4 hits.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

**▸ STOP 1** — foundations ready: types defined, four content data files in place with PLACEHOLDER discipline + correct section counts + verbatim openers + reviewNote markers on the spec-flagged sections.

---

## Batch B — template primitives  ▸ STOP 2

### Phase 3: User Story 1 (template components consumed by all four routes)

### T007 · [P] [US1] `LegalHero` (server)
Create `apps/web/src/components/legal/legal-hero.tsx` — async Server Component. Accepts `props: { hero: LegalHeroContent }` (or `LegalHeroProps`). Renders a left-aligned hero in a `max-w-4xl mx-auto px-grid pt-section pb-loose` container: `<p>` eyebrow (`text-body-sm font-medium uppercase tracking-wide text-accent-bristle`), `<h1>` headline (`mt-grid font-serif text-display-lg text-text-primary`), and `<p>` caption (`mt-grid text-body-sm text-text-secondary`) rendering `Last updated · {posted}` when `effective` is absent, or `Last updated · {posted} · Effective {effective}` when both present. Zero hex literals, zero font-family literals.
- **Files**: `apps/web/src/components/legal/legal-hero.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; eyebrow class includes `text-accent-bristle`; headline uses `font-serif text-display-lg`; caption conditionally renders `· Effective ...` only when `hero.lastUpdated.effective` is defined; `grep -E "#[0-9A-Fa-f]{3,8}" apps/web/src/components/legal/legal-hero.tsx` returns 0.
- **Commit**: `feat(web): add LegalHero (eyebrow + headline + last-updated caption) (slice 009)`

### T008 · [P] [US1] `LegalSection` (server, renders ONLY paragraphs)
Create `apps/web/src/components/legal/legal-section.tsx` — async Server Component. Accepts `props: { section: LegalSectionContent }` (or `LegalSectionProps`). Renders `<section id={section.id} data-legal-section={section.id} className="flex flex-col gap-grid scroll-mt-section"> <h2 className="font-serif text-h2 text-text-primary">{section.number}. {section.title}</h2> {section.paragraphs.map((p, i) => <p key={i} className="font-serif text-body-lg text-text-primary">{p}</p>)} </section>`. **The component MUST NOT read or render `section.reviewNote`** (FR-018; developer-facing only). The `scroll-mt-section` class ensures deep-link anchors don't land hidden behind the visible top nav. Zero hex literals.
- **Files**: `apps/web/src/components/legal/legal-section.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `<section id={...} data-legal-section={...}>`; renders `<h2>` with `{number}. {title}` pattern; maps `paragraphs` to `<p>` elements; `grep "reviewNote" apps/web/src/components/legal/legal-section.tsx` returns **0 hits** (component must not reference the field at all); `grep -E "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add LegalSection (numbered <section> + paragraphs; never renders reviewNote) (slice 009)`

### T009 · [P] [US1] `TocRail` (client — the only client file this slice)
Create `apps/web/src/components/legal/toc-rail.tsx` as the **only** client component in slice 009. Start file with `"use client";`. Mirrors slice-006 `apps/web/src/components/faq/scroll-spy-rail.tsx` structurally **without importing or modifying it** — the entire shape (state, refs, IO config, click handler, mobile auto-scroll useEffect, render structure) is reproduced with the legal-pages-specific selector `[data-legal-section]` and the `TocItem`-typed prop surface. Specifically:
- Props: `{ items: ReadonlyArray<TocItem> }`.
- `useState<string>(items[0]?.id ?? "")` for active section (initial = first section in order).
- `useRef<Map<string, number>>(new Map())` for `visibleItems` (IO topY tracking).
- `useRef<Map<string, HTMLAnchorElement>>(new Map())` for `mobilePillRefs`.
- Constants: `PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"`, `DESKTOP_MQ = "(min-width: 768px)"`.
- First `useEffect` (mount-only): `document.querySelectorAll<HTMLElement>("[data-legal-section]")` → new `IntersectionObserver` with `{ rootMargin: "-80px 0px -55% 0px", threshold: 0 }`; callback updates `visibleItems` Map; topmost-`topY` resolution; no-intersection branch early-returns without clearing active (no flicker); cleanup disconnects observer.
- Second `useEffect` keyed on `[active]`: `if (window.matchMedia(DESKTOP_MQ).matches) return` early; `pill.scrollIntoView({inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth"})`.
- `handleClick(e, sectionId)`: pass through modified clicks (Cmd/Ctrl/middle/shift) via early return so the browser handles new-tab navigation natively; otherwise `e.preventDefault()`, `target = document.getElementById(sectionId)`, read reduced-motion fresh, `target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"})`.
- Render: `<nav aria-label="Sections of the page">` wrapping desktop sticky `<ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">` AND mobile horizontal `<ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">`. Each rail item is `<a href="#{item.id}" aria-current={isActive ? "location" : undefined} onClick={handleClick}>`. **NO `role="tablist"` / `role="tab"` / `aria-selected`** (current-location nav pattern per slice-006 STOP-2 fix). Active visual treatment: desktop `border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary`, mobile `bg-text-primary text-surface-card rounded-pill px-grid py-1.5`. Inactive: desktop `border-l-2 border-transparent py-1 pl-snug text-text-secondary hover:text-text-primary`, mobile `border border-border-default bg-surface-card text-text-secondary rounded-pill`. `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle` on every anchor. Rail item label: `{item.number}. {item.title}`. Zero hex literals.
- **Files**: `apps/web/src/components/legal/toc-rail.tsx`
- **Depends on**: T001
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; imports `useState`, `useEffect`, `useRef` from `react` and `type MouseEvent` (for handleClick signature); imports `TocItem` from `./types`; selector literal `"[data-legal-section]"` present (and NOT `"[data-faq-item]"`); `rootMargin: "-80px 0px -55% 0px"` and `threshold: 0` present; `<nav aria-label="Sections of the page">` present; NO `role="tablist"` / `role="tab"` / `aria-selected` strings anywhere in the file (`grep` returns 0); reduced-motion read inside `handleClick` and inside the second `useEffect` (NOT at module top); `import` of slice-006 `scroll-spy-rail` is absent (`grep "scroll-spy-rail" apps/web/src/components/legal/toc-rail.tsx` returns 0 — additive only); hex grep clean.
- **Commit**: `feat(web): add TocRail (current-location nav + IO + mobile pill auto-scroll, mirrors FAQ rail pattern) (slice 009)`

**▸ STOP 2** — template primitives done: `LegalHero`, `LegalSection`, `TocRail` typecheck in isolation. The rail is structurally identical to slice-006 FAQ rail but lives in a separate file; tracked follow-up dedupes both into a shared `SectionScrollSpyRail` in a future refactor slice.

---

## Batch C — LegalLayout + 4 routes  ▸ STOP 3

### Phase 4: User Story 1 (page assembly) + User Story 2 (footer Legal column flips to live)

### T010 · [US1] `LegalLayout` (server, shared template)
Create `apps/web/src/components/legal/legal-layout.tsx` — async Server Component. Accepts `props: { content: LegalContent }`. Imports `TopNav` and `SiteFooter` from `@/components/landing/`; imports `LegalHero`, `LegalSection`, `TocRail` from this directory; imports `LegalContent`, `TocItem` types from `./types`. Renders:

```tsx
<>
  <TopNav />
  <main className="mx-auto max-w-6xl px-grid">
    <LegalHero hero={content.hero} />
    <div className="grid gap-grid pb-section md:grid-cols-[16rem_1fr] md:gap-section">
      <TocRail items={tocItems} />
      <div className="flex flex-col gap-section">
        {content.sections.map((section) => (
          <LegalSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  </main>
  <SiteFooter />
</>
```

Where `tocItems` is `content.sections.map(s => ({id: s.id, number: s.number, title: s.title}))` — the projection per plan §D4 keeps the rail's prop surface tight (no paragraph prose, no reviewNote serialized to client hydration).
- **Files**: `apps/web/src/components/legal/legal-layout.tsx`
- **Depends on**: T001 (types), T007 (LegalHero), T008 (LegalSection), T009 (TocRail)
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export OR named `LegalLayout` export is an async function; composes the 5 elements in order (TopNav · LegalHero · grid wrapping TocRail + LegalSections · SiteFooter); grid template `md:grid-cols-[16rem_1fr]` + `md:gap-section` present; `tocItems` projection present (paragraphs and reviewNote NOT passed into TocRail); `grep -E "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add LegalLayout (shared template: TopNav + LegalHero + grid + sections + SiteFooter) (slice 009)`

### T011 · [P] [US1] `/terms/page.tsx` (Terms route + metadata)
Create `apps/web/src/app/terms/page.tsx` — brand-new route. `async function Terms()` Server Component returning `<LegalLayout content={TERMS_CONTENT} />`. Export `metadata: Metadata` per plan decision §10: `metadataBase: new URL(SITE_URL)`, `title: "Terms of Service — Bristle"`, `description: "The terms that govern your use of Bristle, including account, billing, cancellation, and liability."`, `openGraph` with same title/description + `type: "website"` + `url: SITE_URL + "/terms"` + `images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }]`. **No `robots` field** → indexable.
- **Files**: `apps/web/src/app/terms/page.tsx`
- **Depends on**: T002 (TERMS_CONTENT), T010 (LegalLayout)
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export is `async function`; metadata has `title: "Terms of Service — Bristle"`, `description` matches verbatim, `openGraph.url: SITE_URL + "/terms"`, absolute OG image, **no `robots` field**; imports `TERMS_CONTENT` from `@/components/legal/terms-content` and `LegalLayout` from `@/components/legal/legal-layout`.
- **Commit**: `feat(web): add /terms route (Terms of Service + metadata) (slice 009)`

### T012 · [P] [US1] `/privacy/page.tsx` (Privacy route + metadata)
Create `apps/web/src/app/privacy/page.tsx` — brand-new route. `async function Privacy()` returning `<LegalLayout content={PRIVACY_CONTENT} />`. Metadata: title `Privacy Policy — Bristle`, description `What data Bristle collects, why we collect it, and the rights you have over it.`, `og:url SITE_URL + "/privacy"`, slice-005 OG image, no `robots`.
- **Files**: `apps/web/src/app/privacy/page.tsx`
- **Depends on**: T003 (PRIVACY_CONTENT), T010 (LegalLayout)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; async function; metadata strings verbatim per spec / decision §10; `og:url` = `SITE_URL + "/privacy"`; no `robots`.
- **Commit**: `feat(web): add /privacy route (Privacy Policy + metadata) (slice 009)`

### T013 · [P] [US1] `/security/page.tsx` (Security route + metadata)
Create `apps/web/src/app/security/page.tsx` — brand-new route. `async function Security()` returning `<LegalLayout content={SECURITY_CONTENT} />`. Metadata: title `Security — Bristle`, description `How Bristle protects customer data and how to report security issues.`, `og:url SITE_URL + "/security"`, slice-005 OG image, no `robots`.
- **Files**: `apps/web/src/app/security/page.tsx`
- **Depends on**: T004 (SECURITY_CONTENT), T010 (LegalLayout)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; async function; metadata strings verbatim; `og:url` = `SITE_URL + "/security"`; no `robots`.
- **Commit**: `feat(web): add /security route (Security + metadata) (slice 009)`

### T014 · [P] [US1] `/gdpr/page.tsx` (GDPR Compliance route + metadata)
Create `apps/web/src/app/gdpr/page.tsx` — brand-new route. `async function Gdpr()` returning `<LegalLayout content={GDPR_CONTENT} />`. Metadata: title `GDPR Compliance — Bristle`, description `Bristle's specific commitments to EU and UK data subjects under GDPR.`, `og:url SITE_URL + "/gdpr"`, slice-005 OG image, no `robots`.
- **Files**: `apps/web/src/app/gdpr/page.tsx`
- **Depends on**: T005 (GDPR_CONTENT), T010 (LegalLayout)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; async function; metadata strings verbatim (note the apostrophe in `Bristle's`); `og:url` = `SITE_URL + "/gdpr"`; no `robots`.
- **Commit**: `feat(web): add /gdpr route (GDPR Compliance + metadata) (slice 009)`

**▸ STOP 3** — LegalLayout composed; all four routes wired with metadata; the slice-005 footer Legal column hrefs (unchanged from slice 005) now resolve to live pages.

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 2 (footer Legal column live) + User Story 3 (perf / a11y / SEO / voice / responsive floors)

### T015 · [US3] VERIFY — local gate
Run the local loop + audits against the post-implementation state.
- **Depends on**: T010, T011, T012, T013, T014
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-015)*
  - **First Load JS budgets (FR-024 / SC-016)**: each of `/terms`, `/privacy`, `/security`, `/gdpr` target ~107-110 KB; ALL < 180 KB gz. If any ≥ 130 KB, investigate accidental bundle leak (zod / Radix Accordion / Resend SDK / lucide bulk import — none should be in any legal route's bundle).
  - **Static prerender** (SC-019): build output marks all four legal routes as `○ Static`.
  - **`pnpm-lock.yaml` unchanged** (SC-023): `git diff --stat origin/main..HEAD -- pnpm-lock.yaml` returns empty (zero new deps).
  - **Server/client boundary** (SC-020): `grep -l "use client" apps/web/src/components/legal/ apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx` returns **exactly one** file: `apps/web/src/components/legal/toc-rail.tsx`. All four route entries are `async function` with no `"use client"`.
  - **Additive-only** (SC-022 / FR-025): `git diff --stat origin/main..HEAD --` shows changes ONLY under `apps/web/src/components/legal/` and `apps/web/src/app/{terms,privacy,security,gdpr}/`. Zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact}/`, `apps/web/src/lib/`, `apps/web/src/app/contact/`, `packages/`, or `design/`.
  - **Greps on all 9 new files** + 4 route files (SC-021): `apps/web/src/components/legal/{types.ts,terms-content.ts,privacy-content.ts,security-content.ts,gdpr-content.ts,legal-hero.tsx,legal-section.tsx,toc-rail.tsx,legal-layout.tsx}` + `apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx`:
    - `hex (#[0-9A-Fa-f]{3,8})` — clean.
    - `font-family|font-name` — clean.
    - `copy-context exclamation` (`grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<'`) — clean. `reviewNote` values may contain `[REVIEW: ...]` markers but per FR-018 those are developer-facing data fields that never reach rendered HTML.
    - `emoji` — clean.
    - `amazing|awesome` (case-insensitive) — clean.
  - **reviewNote rendering discipline** (FR-018): start the dev server (`pnpm --filter web start`) and curl `/terms`, `/privacy`, `/security`, `/gdpr`; `grep -c "\[REVIEW:" /tmp/legal-*.html` returns **0** across all four — none of the developer-facing review markers leak into the rendered HTML.
  - **Per-page metadata** (SC-013): `curl -s <local>/terms | grep -oE '<title>[^<]+</title>|og:(title|description|url|image|type)'` shows all five OG tags + title; `og:url` absolute (`https://bristle.vercel.app/terms`); `og:image` absolute slice-005 raster; **no `<meta name="robots">` in body**. Same checks for `/privacy`, `/security`, `/gdpr` with their matching titles + descriptions + URLs.
  - **Deep-link anchor walk**: `curl -s <local>/terms` includes `id="cancellation-refunds"` on the 6th `<section>`; visiting `<local>/terms#cancellation-refunds` in a browser scrolls to that section; the 6th TocRail anchor gets `aria-current="location"` within ~100ms of load.
  - **Slice-005 footer regression check** (SC-014): `git diff --stat origin/main..HEAD -- apps/web/src/components/landing/site-footer.tsx` returns empty (footer unchanged); from `<local>/`, click footer Legal column "Terms" → lands on `/terms` (HTTP 200); repeat for "Privacy", "Security", "GDPR" — all four land 200 (was 404 pre-slice-009).
  - **Responsive sweep** (SC-012) at 320/375/768/1024/1280/1440 on each of `/terms`, `/privacy`, `/security`, `/gdpr` — no h-scroll, no overlap, no clipped text; TocRail collapses to horizontal pill row below `md`.
  - **Visual diff** (SC-011) vs `design/Public_pages.pdf` page 10 at 1280 width for `/terms` ONLY (template reference). The other three routes (`/privacy`, `/security`, `/gdpr`) get structural correctness via code review + Lighthouse, not pixel-diff (no PDFs exist for those three).
  - **Keyboard reach** (FR-019 / AC US3-6): Tab through `/terms` — every TocRail anchor reachable, visible focus rings (`focus-visible:outline-2 outline-offset-2 outline-accent-bristle`); section headings render as semantic `<h2>` per FR-005.
  - **Reduced-motion walk** (SC-007 / AC US3-7): with OS `prefers-reduced-motion: reduce` ON, click a TocRail anchor → scroll behavior is instant (`auto`), no animation; mobile pill auto-scroll-into-view also instant. Toggle OS preference OFF mid-session → next click smooth-scrolls.
  - **Lighthouse on local prod build** (SC-017) for `/terms`, `/privacy`, `/security`, `/gdpr` — Performance / Accessibility / Best-Practices each ≥ 90; SEO 100 on local-prod (preview SEO 60 is the documented `x-robots-tag` artifact, not a regression).
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T016 · [US3] VERIFY — preview parity (gate)
Push the branch via the gh-token HTTPS workaround; confirm the Vercel preview.
- **Depends on**: T015
- **Verify (SC-018)**:
  - Preview URL pattern: `https://bristle-git-009-legal-pages-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api repos/cornel-stack/bristle/commits/<sha>/check-runs` after the Vercel build completes).
  - **Routes resolve**: `curl -sI <preview>/{terms,privacy,security,gdpr}` all return HTTP 200.
  - **Meta tags on preview**: `curl -s <preview>/terms | grep -oE 'og:(title|description|url|image|type)'` shows all five OG tags with absolute `bristle.vercel.app` URLs (NOT preview host); same for the other three.
  - **No body `<meta robots>`**: `curl -s <preview>/{terms,privacy,security,gdpr} | grep -c '<meta[^>]*name="robots"'` returns 0 (the `x-robots-tag: noindex` HTTP header is the Vercel preview default — same artifact as prior slices, not a body meta; pages indexable in production).
  - **Slice-005 footer regression check on preview**: from `<preview>/`, click each of the four Legal column links — Terms / Privacy / Security / GDPR — confirm each lands on its respective `/terms` / `/privacy` / `/security` / `/gdpr` page on the preview hostname (HTTP 200, NOT 404 as they were pre-slice-009).
  - **Slice-006 / slice-008 regression check on preview**: `/pricing`, `/faq`, `/about`, `/contact` still work; FAQ rail still tracks active section + has `aria-current="location"`; slice-006 chrome's `/contact` references (Enterprise card, FAQ Still-Stuck, FAQ Open-a-ticket) still land on `/contact`; landing footer "Help center" still goes to `/faq`.
  - **No client-side console errors** on any of the four legal pages in the browser console.
  - **TocRail behavior on preview**: scroll `/terms`; active section in rail follows topmost-visible content; click a TOC anchor → smooth-scroll (or instant if OS reduced-motion ON); mobile (375 width) horizontal pill row visible above the content; active pill auto-scrolls into view as visitor scrolls.
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — Legal template + four legal pages live locally and on the preview; slice complete.

---

## Dependencies & Execution Order

```
Batch A:
  T001 (types.ts)
    ├── T002 [P] (terms-content)   ──┐
    ├── T003 [P] (privacy-content) ──┤
    ├── T004 [P] (security-content) ─┤
    └── T005 [P] (gdpr-content) ─────┤
  T006 (VERIFY) ← T001..T005

Batch B:
  T007 [P] (LegalHero)   ← T001
  T008 [P] (LegalSection) ← T001
  T009 [P] (TocRail)     ← T001  (additive only — does NOT import slice-006 FaqScrollSpyRail)

Batch C:
  T010 (LegalLayout) ← T001 + T007 + T008 + T009
  T011 [P] (/terms/page.tsx)    ← T002 + T010
  T012 [P] (/privacy/page.tsx)  ← T003 + T010
  T013 [P] (/security/page.tsx) ← T004 + T010
  T014 [P] (/gdpr/page.tsx)     ← T005 + T010

Batch D:
  T015 (local gate)     ← T011 + T012 + T013 + T014
  T016 (preview parity) ← T015
```

### Key dependency edges
- **T001 → T002-T005**: type-only chain. The four content data files import `LegalContent` from `types.ts` to type their constant — must compile before T002-T005 can typecheck.
- **T001 → T007 + T008 + T009**: the three Batch B components all import types from `types.ts` (LegalHeroContent for hero, LegalSectionContent for section, TocItem for rail).
- **T010 → T011-T014**: `LegalLayout` is the shared template; all four route pages render `<LegalLayout content={CONTENT} />`. Without T010, the route files cannot typecheck.
- **T002-T005 → T011-T014** (per-route): each route imports its matching content constant (`TERMS_CONTENT` for T011, `PRIVACY_CONTENT` for T012, etc.). Cross-content imports forbidden — each route is paired with exactly one content file.
- **T009 → T010 (client-into-server composition)**: `LegalLayout` is a Server Component that renders `<TocRail/>` as a child. Next.js's RSC model permits client components rendered inside server components via the standard import; the bundle for `TocRail` ships to the client, the server-component tree ships as SSR'd HTML.
- **T015 → T016**: preview parity runs after local checks pass + the branch is pushed.

### Parallel opportunities
- **Batch A**: T002/T003/T004/T005 touch independent files → parallel. T001 (types) is sequential (gates the four content files). T006 (verify) joins them.
- **Batch B**: T007/T008/T009 are independent files → parallel.
- **Batch C**: T011/T012/T013/T014 are independent files → parallel. T010 (LegalLayout) is sequential (gates all four route files).

### Sequencing concerns
1. **T001 (`types.ts`) is the hardest gate of the slice** — must compile before any of T002-T005 or T007-T009 can typecheck (every Batch A content file and every Batch B component imports a type from it). Recommended order: T001 first, then the [P] cohort (T002-T005), then T006.
2. **T010 (`LegalLayout`) is the second-hardest gate** — must compile before T011-T014. T010 itself depends on all four Batch B components (T007, T008, T009) being in place. Recommended order: complete Batch B fully, then T010, then the [P] cohort (T011-T014).
3. **Visual diff + Lighthouse + responsive sweep + keyboard reach + reduced-motion walk defer to reviewer** at T015/T016 — same CLI-agent constraint as prior slices. Code-side proxies (build, greps, diff-stat, route-200 curls, meta-tag curls, dep audit, deep-link HTML inspection) are agent coverage; viewport sweep + Lighthouse + PDF visual diff + browser-driven TocRail behavior + reduced-motion runtime check are reviewer coverage.
4. **Slice-005 footer regression check** (SC-014) is the U2-defining verification — `apps/web/src/components/landing/site-footer.tsx` must remain in the `git diff --stat` empty zone. The four Legal column hrefs were authored in slice 005 to point at these routes; the routes go live the moment T011-T014 land. Defect would be a slice-005 footer edit that somehow leaked in.
5. **No rebase noise expected at T016 push** — branch is on top of clean `main` from the start of this slice (no stacking like 006 → 007 had).
6. **`reviewNote` rendering discipline** (FR-018, SC-021): the T008 LegalSection component MUST NOT reference `section.reviewNote` at all (verified at T008 commit time via `grep "reviewNote" apps/web/src/components/legal/legal-section.tsx` returning 0); the T015 gate additionally curls the rendered HTML and confirms zero `[REVIEW:` substrings escape. Two independent checks for the same invariant.

## Implementation strategy (4 stops)
1. **Stop 1 (Batch A)**: foundations — types + four content data files with PLACEHOLDER headers, correct section counts, verbatim openers, reviewNote markers on spec-flagged sections.
2. **Stop 2 (Batch B)**: three template primitives (LegalHero, LegalSection, TocRail) typecheck in isolation; TocRail is the only client component.
3. **Stop 3 (Batch C)**: LegalLayout assembles the page chrome + four routes wire it up with their content + metadata. Slice-005 footer Legal column flips from 404 to live (without editing the footer).
4. **Stop 4 (Batch D)**: full quality/preview gate including TocRail behavior, reviewNote rendering discipline, additive-only check.

## Task count
16 tasks — **13 commit-producing** (T001-T005, T007-T014), **3 verification gates** (T006, T015, T016). Grouped into **4 batches / 4 stops**. Smaller than slice 008 (22 tasks) because: no new dependencies, no env vars, no Server Action, no form component. Slightly larger than slice 007 (5 tasks) because: 4 routes instead of 0, 1 new client component, 1 shared layout component.

## Out of scope (no tasks)
- `/privacy/sub-processors` deep page (referenced from Privacy section 5 and GDPR section 6 prose) — **follow-up slice** (likely 2.7 or a separate sub-processors slice).
- Real legal review by counsel — copy is `[PLACEHOLDER]`; founder/legal reviews and edits before production launch (FR-013, FR-014).
- Extract shared `SectionScrollSpyRail` from `FaqScrollSpyRail` + `TocRail` — **tracked follow-up** (refactor slice); explicitly out of scope this slice per spec to keep the change additive only.
- Newsletter wiring (still slice 2.7).
- Better Stack status integration (still slice 2.7).
- next-themes integration / Editorial Dark (still deferred to slice 2.6).
- Form spam protection follow-up (carried from slice 008 — N/A for slice 009 since there's no form).
- Any modifications to slice-005 chrome (top nav, site footer), slice-006 pricing/FAQ, slice-008 about/contact, or any `lib/` module.
- Any modifications to `design/Public_pages.pdf`.
- Any DB schema change, any new `@bristle/db` query helper.
- Real `/api/contact` JSON route handler (carried from slice 008 follow-up; N/A for slice 009).
