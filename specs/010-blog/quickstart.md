# Quickstart / Verification: Slice 010

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (already done at plan time)

- PR #8 (slice 009) merged to `main` via merge commit `9ccbf3f` on 2026-05-24.
- `010-blog` cut from clean `origin/main` (no stacking; branch starts at the spec commit `187684d`).
- Slice-005 top nav `Blog` link → `/blog` (line 5) — verified at plan time; **no top-nav edit this slice**.
- Slice-005 site-footer Company column `Blog` link → `/blog` (line 17) — verified at plan time; **no footer edit this slice**.
- No new top-level deps (`BlogRailToc` is hand-rolled `IntersectionObserver`, same pattern as slice-006 FAQ rail and slice-009 TocRail; `InlineFigure` is hand-rolled inline SVG; dates are pre-formatted `displayDate` strings — no chart library, no date library).

## Local

```bash
pnpm install                                          # no new dep this slice — pnpm-lock.yaml unchanged
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # /blog + 7 /blog/[slug] routes render
```

No DB env required. All 8 new routes are content-static.

## Acceptance checks (map to SC-001 … SC-030)

### Routes resolve (T-local)

- **SC-001** — `curl -sI <local>/blog` → HTTP 200. For each of the 7 slugs, `curl -sI <local>/blog/{slug}` → HTTP 200.
- **SC-009** — `curl -sI <local>/blog/this-slug-does-not-exist` → HTTP 404 (Next.js default).

### Index structure (T-local)

- **SC-002** — `/blog` renders top to bottom: top nav + BlogHero (`BRISTLE BLOG` eyebrow + serif `Field Notes` headline + subhead) + BlogFilterChips (5 chips, `All` initially active) + BlogFeaturedCard (with `IN THIS ISSUE` callout) + BlogArticleGrid (3×2 grid of 6 secondary cards on desktop) + site footer.
- **SC-003** — visual diff `/blog` vs `design/Public_pages.pdf` page 5 at 1280 width passes within 4px tolerance for hero, filter-chip row, featured card with `IN THIS ISSUE` callout, and the 6-card 3×2 grid.

### Index filter chip behavior (T-local, browser walk)

- **SC-004** — clicking `Data analysis` reduces visible cards to articles 1 (featured, inline in grid) + 7 = 2 cards. Clicking `Product strategy` → articles 2 + 5 = 2 cards. Clicking `Indie hacker` → articles 3 + 6 = 2 cards. Clicking `Devtools` → article 4 only = 1 card. Clicking `All` → 1 featured slot + 6 grid cards = 7 articles visible.
- **SC-005** — active chip carries `aria-pressed="true"` and the filled-pill visual state; non-active chips carry `aria-pressed="false"` and the outlined-pill state. The chip group is wrapped in `role="toolbar" aria-label="Filter articles by category"`. Verifiable via DevTools inspector + the keyboard walk.

### Featured article structure + behavior (T-local, browser walk)

- **SC-006** — `/blog/what-50000-github-issues-reveal-about-developer-pain` renders top to bottom: top nav + BlogPostHero (eyebrow + serif title + meta row + initials avatar) + 2-column body (left = lead 2 paragraphs + 4 `<section data-blog-section="...">` blocks [scope-refusals with inline pull quote between paragraphs + inline figure after paragraph 2, comment-count, willingness-to-pay, method-data]; right = sticky BlogRailToc 4 anchors + TryBristleCard) + site footer. Visual diff vs `design/Public_pages.pdf` page 6 at 1280 within 4px tolerance.
- **SC-010** — BlogRailToc on the featured article renders 4 desktop anchor links AND 4 mobile horizontal pill anchors.
- **SC-011** — clicking a BlogRailToc anchor smooth-scrolls to the matching section. With OS reduced-motion ON, scroll becomes instant. Modifier-key clicks (Cmd, Ctrl, Shift, middle-click) short-circuit the JS handler and let the browser handle natively (open in new tab / window).
- **SC-012** — as the visitor scrolls the featured article, the BlogRailToc's active state follows the topmost-visible section.
- **SC-013** — the active BlogRailToc anchor carries `aria-current="location"`; non-active anchors do NOT.
- **SC-014** — on mobile (`<md`), the horizontal pill row auto-scrolls the active pill into view as the visitor scrolls; instant under reduced-motion.
- **SC-015** — visiting `<local>/blog/what-50000-github-issues-reveal-about-developer-pain#method-data` lands the visitor scrolled to `<section id="method-data">`. The BlogRailToc's 4th item becomes `aria-current="location"` within ~100ms of load.

### Stub articles (T-local)

- **SC-007** — each of the 6 secondary article routes renders BlogPostLayout with the stub treatment: BlogPostHero with full metadata, BlogPostBody renders only the stub lead + `Full article forthcoming.` caption, zero `<section data-blog-section="...">` elements in the body, BlogRailToc returns null (no rail visible), TryBristleCard renders in the right column.
- **SC-026** — `curl -s <local>/blog/{slug} | grep -F "Full article forthcoming."` returns a match for each of the 6 stub routes. `curl -s <local>/blog/{slug} | grep -cE "data-blog-section"` returns `0` for each of the 6 stub routes.

### Static generation (T-local)

- **SC-008** — `next build` output lists `/blog/[slug]` with 7 individual entries under the `●` (or `○ Static`) marker — one for each slug:
  ```
  ├ ● /blog/[slug]
  ├   ├ /blog/what-50000-github-issues-reveal-about-developer-pain
  ├   ├ /blog/three-signals-that-separate-a-product-from-a-feature
  ├   ├ /blog/how-we-tracked-4m-unmet-demand-developer-tool-60-days
  ├   ├ /blog/vercel-cold-starts-shared-hosting-cpu-limits
  ├   ├ /blog/why-pricing-pages-worst-place-discover-demand
  ├   ├ /blog/field-notes-32-paid-customer-interviews
  ├   └ /blog/app-store-reviews-most-underused-product-research-surface
  ```
- **SC-021** — build output marks `/blog` and all 7 `/blog/[slug]` routes as `○ Static` (no `ƒ Dynamic`).

### Slice-005 top-nav `Blog` regression check (T-local)

- **SC-022** — from `<local>/`, click top-nav `Blog` → lands on `/blog` (HTTP 200; was the slice-005 `ComingSoon` soft-404). From `<local>/`, scroll to footer Company column `Blog` → lands on `/blog` (HTTP 200; same flip). **`apps/web/src/components/landing/top-nav.tsx` and `apps/web/src/components/landing/site-footer.tsx` are unchanged** in `git diff --stat`.

### Responsive sweep (T-local)

- **SC-016** — sweep at 320 / 375 / 768 / 1024 / 1280 / 1440 on `/blog` and on all 7 `/blog/[slug]` routes — no h-scroll / overlap / clip; BlogArticleGrid collapses 3-col → single-col below desktop; BlogRailToc collapses sticky rail → mobile pill row at and below `md`. Stub articles render their lead + `Full article forthcoming.` caption + TryBristleCard cleanly at every width.

### Metadata (T-local)

- **SC-017** — `/blog` head emits `<title>` `Field Notes — Bristle`, `<meta name="description">` = the subhead (`Research, analysis, and the occasional opinion on building products against evidence.`), `og:title`, `og:description`, `og:url` = `${SITE_URL}/blog` (absolute, from `SITE_URL`), `og:image` = `${SITE_URL}/og-image.png` (absolute, slice-005 raster), `og:type` = `website`. **No `<meta robots>`** in body.
- **SC-018** — each `/blog/[slug]` head emits `<title>` `{article.title} — Bristle`, `<meta name="description">` = `article.summary`, `og:title`, `og:description`, `og:url` = `${SITE_URL}/blog/{slug}` (absolute), `og:image` = `${SITE_URL}/og-image.png` (absolute), `og:type` = `article`. **No `<meta robots>`** in body.

### Build (T-local)

- **SC-023** — `pnpm typecheck && pnpm lint && pnpm --filter web build` all exit 0.
- **SC-020** — First Load JS for `/blog` and each of the 7 `/blog/[slug]` routes < 180 KB gz. Expected: `/blog` ~115-120 KB, `/blog/[slug]` ~110-115 KB. If any route ≥ 130 KB, investigate — likely a card-projection leak (`/blog` shipped full `BlogArticle[]` not the `BlogArticleCard[]` Pick) or an accidental chart library import.
- **SC-029** — `pnpm-lock.yaml` is unchanged (`git diff --stat origin/main..HEAD -- pnpm-lock.yaml` empty).

### Lighthouse (T-local, browser walk)

- **SC-019** — Lighthouse on `/blog` and on `/blog/what-50000-github-issues-reveal-about-developer-pain` on local prod: Performance / Accessibility / Best Practices / SEO each ≥ 90. SEO 100 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact (preview-only). (Lighthouse on the 6 stub articles is optional — same template applies, structurally identical to the featured route.)

### Server/client boundary + additive-only (T-local)

- **SC-025** — `grep -l "use client" apps/web/src/components/blog/ apps/web/src/app/blog/page.tsx apps/web/src/app/blog/\[slug\]/page.tsx` returns **exactly three** files: `blog-filter-chips.tsx`, `blog-article-grid.tsx`, `blog-rail-toc.tsx`.
- **SC-028** — `git diff --stat origin/main..HEAD` shows zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact,legal}/`, `apps/web/src/lib/`, `apps/web/src/app/contact/`, `packages/`, or `design/`. Additive only — except for the wholesale rewrite of `apps/web/src/app/blog/page.tsx` (slice-005's `ComingSoon` stub → slice-010's full Blog index, per FR-001 / FR-030).

### Voice / tokens (T-local)

- **SC-027** — greps across `apps/web/src/components/blog/` plus the two `page.tsx` files: zero `#[0-9A-Fa-f]{3,8}` hex literals; zero `font-family`/`font-name` string literals; zero exclamation marks in **user-visible copy** (the JS-operator carve-out stands; the `[PLACEHOLDER]` header comment on `blog-articles.ts` is exempt because it never renders); zero emoji; zero "amazing/awesome" register in any rendered prose. The featured-article prose's apostrophe-quote constructs (`'look at trends.'`, `"yes, but not here"`) are punctuation, not voice violations. The dollar-sign in article 3's title (`$4M in unmet demand`) is punctuation, not a voice violation.
- **SC-030** — every article in `BLOG_ARTICLES` uses `authorName: "Cornel Okoth"` and `authorInitials: "CO"`. Verifiable by `grep -c "Cornel Okoth" apps/web/src/components/blog/blog-articles.ts` returning `7`. Overrides design's Elena Hwang / Jules Marin placeholders per clarification (f) / FR-021.

### Article body integrity (T-local)

- featured article's verbatim opening phrases present in `blog-articles.ts`:
  - lead P1: `"The first answer most product tools give you"`
  - lead P2: `"For this analysis we sampled every issue closed-as-wontfix"`
  - section 1 P1: `"Maintainers close issues when they could fix them"`
  - section 2 P1: `"An issue that closes with three comments is a non-event"`
  - section 3 P1: `"You will find phrases like 'I'd literally pay for this'"`
  - section 4 P1: `"We pulled issues from GitHub's public API"`
- stub article opening phrases present (one per article):
  - article 2: `"You can read 200 complaints and still build the wrong thing"`
  - article 3: `"A case study using the willingness-to-pay column you have been ignoring"`
  - article 4: `"A frequency chart, a momentum chart"`
  - article 5: `"Comparing what people say they will pay"`
  - article 6: `"A small experiment, with verbatim transcripts"`
  - article 7: `"They are public, attributed, time-stamped"`

### Reviewer-side checks (T-local, browser walk)

- Keyboard reach on `/blog`: Tab through the page — every filter chip reachable, every card link reachable, focus rings visible on every interactive element (FR-023).
- Keyboard reach on `/blog/what-...`: Tab through — every BlogRailToc anchor reachable, focus rings visible, the active anchor announces `aria-current="location"` (verify with screen reader if available).
- Reduced-motion walk: with OS preference ON, click a BlogRailToc anchor → instant scroll, no animation. Toggle preference OFF mid-session → next click smooth-scrolls without reload.
- Modifier-key passthrough: Cmd-click (Mac) / Ctrl-click (Linux/Windows) a BlogRailToc anchor → opens in new tab as native anchor behavior. Middle-click same → new tab. Shift-click same → new window (browser-dependent).
- BlogRailToc mobile: at 375 width, scroll the featured article → active pill auto-scrolls into view in the horizontal pill row.
- Stub article browse: open any of the 6 stub slugs → confirm the right column shows only TryBristleCard (no empty rail visible).
- Card hover: hover any `BlogArticleCard` → confirm the hover state (border / color shift) is a §4.5 color-only transition, 120ms.

### Preview parity (T-preview)

- **SC-024** — Vercel preview URL renders `/blog` + all 7 `/blog/[slug]` routes identically to local. No browser-console errors. BlogRailToc behavior identical (smooth-scroll, active tracking, mobile pill auto-scroll, modifier-key passthrough). BlogFilterChips behavior identical (5 chips, single-select with `All` reset, `aria-pressed` toggling).
- **Slice-005 / 006 / 008 / 009 regression check on preview**:
  - `/` (slice-005 landing) — top nav `Blog` link lands on the live `/blog`; site-footer `Blog` link lands on the live `/blog`. Both were soft-404s pre-slice-010.
  - `/pricing` Enterprise card "Contact sales →" still lands on `/contact` (slice 008).
  - `/faq` rail / accordion / bottom CTA still work (slice 006); footer "Help center" still goes to `/faq` (slice 006).
  - `/about` and `/contact` still render (slice 008).
  - `/terms` / `/privacy` / `/security` / `/gdpr` still render (slice 009); TocRail behavior still works.

## Production

- Vercel env already set for slices 004 / 005 / 006 / 008. **No new env vars** this slice.
- All 8 new pages prerender at build time; first paint is instant.
- **No `v0.2.0` tag** from this slice. Tier 2 ships `v0.2.0` only after all of 2.1–2.7 lands. Slice 010 is slice 2.4 — Tier 2 is **6/7** done after merge (counting the interleaved 007 patch: 2.1 ✓, 2.2 ✓, 007 patch ✓, 2.3 part 1 (008) ✓, 2.3 part 2 (009) ✓, **2.4 (010)** ✓; remaining: 2.5 Changelog, 2.6 Public sample problem detail / next-themes target, 2.7 Final wire-up).

## Notes

- **Pre-launch content review** of every `[PLACEHOLDER]` paragraph in `blog-articles.ts` (founder edit pass) happens BEFORE Tier-2 v0.2.0 launch, NOT before slice 010 merge. Slice 010 ships with placeholders intact, marked by the file-header comment. The 6 stub articles' `stubLead` strings are also placeholders — the founder authors their full bodies in a content patch slice (10a/10b precedent, or directly in source between Tier 2 ship and Tier 3 work).
- **The featured article's Method & data section** is 2 paragraphs of plausible methodology placeholder — the founder edits it to match the actual analysis methodology (real data sources, real classifier training set) before publishing.
- **The InlineFigure** is a decorative hand-rolled SVG — the founder swaps to a real chart (recharts component or static SVG export from the actual analysis) before publishing.
- **BlogRailToc is the third structural mirror** of the slice-006 FaqScrollSpyRail and slice-009 TocRail. Refactor pressure for `SectionScrollSpyRail` is now real — primary tracked follow-up. Slice 010 ships the mirror knowingly; refactor lands in a future slice.
- **`/signup` carry-forward** — the `TryBristleCard` CTA on all 7 article pages links to `/signup`, still a soft-404 until Tier 3 slice 3.1 auth ships.
- **No new known-out-of-scope-404 destinations** introduced by slice 010 itself (unlike slice 009's `/privacy/sub-processors`). The 6 secondary article routes are live under `generateStaticParams`; they just render the stub-body treatment per US3.
