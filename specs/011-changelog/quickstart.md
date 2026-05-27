# Quickstart / Verification: Slice 011

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (already done at plan time)

- PR #9 (slice 010) merged to `main` via merge commit `f434f44` on 2026-05-26.
- `011-changelog` cut from clean `main` (no stacking; main fast-forwarded via gh-token HTTPS before branch creation).
- Slice-005 top-nav line 6 `{ label: "Changelog", href: "/changelog" }` — verified at plan time; **no top-nav edit this slice**.
- Slice-005 site-footer line 8 `{ label: "Changelog", href: "/changelog" }` (Product column) — verified at plan time; **no footer edit this slice**.
- No new top-level deps (`ChangelogJumpNav` is hand-rolled `IntersectionObserver`, same pattern as slice-006/009/010 rails; `ChangelogFigure` is hand-rolled inline SVG; Atom XML is hand-rolled template strings with explicit `escapeXml()` helper).

## Local

```bash
pnpm install                                          # no new dep this slice — pnpm-lock.yaml unchanged
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # /changelog + /changelog.atom render
```

No DB env required. Both surfaces are content-static.

## Acceptance checks (map to SC-001 … SC-030)

### Routes resolve (T014)

- **SC-001 part 1**: `curl -sI <local>/changelog` → HTTP 200.
- **SC-001 part 2**: `curl -i <local>/changelog.atom` → HTTP 200 + `Content-Type: application/atom+xml; charset=utf-8`.

### Page structure (T014)

- **SC-002**: `/changelog` renders top to bottom: top nav + ChangelogHero (`CHANGELOG` eyebrow + serif `What's new in Bristle.` headline + subhead) + two-column body (left rail = ChangelogJumpNav with 5 anchors + RssSubscribeCard below; right column = 5 ChangelogMonthSections with 11 entries) + site footer.
- **SC-003**: visual diff `/changelog` vs `design/Public_pages.pdf` page 8 at 1280 width passes within 4px tolerance for hero, left rail, 5 month sections, 11 entries with type badges, and the May 8 figure placeholder.

### ChangelogJumpNav behavior (T014, browser walk)

- **SC-004**: rail renders 5 desktop sticky anchors AND 5 mobile horizontal pill anchors.
- **SC-005**: clicking a rail anchor smooth-scrolls to the matching month section. With OS reduced-motion ON, scroll becomes instant. Modifier-key clicks (Cmd/Ctrl/Shift/middle) short-circuit the JS handler.
- **SC-006**: as the visitor scrolls, active state follows topmost-visible month section.
- **SC-007**: active anchor carries `aria-current="location"`; non-active don't. Rail wrapped in `<nav aria-label="Jump to a month">`. NO `role="tablist"` / `role="tab"` / `aria-selected`.
- **SC-008**: on mobile (`<md`), horizontal pill row auto-scrolls active pill into view; instant under reduced-motion.

### "Current" pill (T014)

- **SC-009**: exactly one `Current` pill renders across `/changelog` — on the May 2026 section (May 8 = max(date) in `CHANGELOG_ENTRIES`). Verifiable by `curl -s <local>/changelog | grep -c ">Current<"` returning `1`.

### Deep-link anchors (T014)

- **SC-010**: `<local>/changelog#entry-export-to-csv` loads scrolled to `<article id="entry-export-to-csv">`. ChangelogJumpNav active state moves to March 2026 within ~100ms.

### Atom feed validation (T014)

- **SC-011 + SC-012**: `curl -i <local>/changelog.atom` returns HTTP 200 + valid Atom 1.0 XML. Element-presence greps:
  ```bash
  curl -s <local>/changelog.atom | grep -c '<feed xmlns="http://www.w3.org/2005/Atom">'   # → 1
  curl -s <local>/changelog.atom | grep -c '<title>Bristle Changelog</title>'             # → 1 (feed-level)
  curl -s <local>/changelog.atom | grep -c '<link rel="self"'                              # → 1
  curl -s <local>/changelog.atom | grep -c '<link rel="alternate" type="text/html"'        # → 12 (1 feed-level + 11 per-entry)
  curl -s <local>/changelog.atom | grep -c '<author><name>Bristle</name></author>'        # → 12 (1 feed-level + 11 per-entry)
  curl -s <local>/changelog.atom | grep -c '<entry>'                                       # → 11
  curl -s <local>/changelog.atom | grep -c '<generator uri="https://bristle.dev"'         # → 1
  ```
- **SC-013**: each `<entry>` block contains `<id>`, `<title>`, `<updated>`, `<link rel="alternate">`, `<summary>`, `<category>`, `<author>` — visually scannable in the feed body.
- **SC-014**: XML-escape correctness — strict parse via:
  ```bash
  xmllint --noout <(curl -s <local>/changelog.atom) && echo "Atom XML valid"
  ```
  If `xmllint` not installed: `apt-get install libxml2-utils` (Debian/Ubuntu) or fallback to W3C feedvalidator.org against the deployed Vercel preview URL.
- **SC-015**: Cache-Control header set: `curl -I <local>/changelog.atom | grep -i cache-control` → `Cache-Control: public, s-maxage=3600` (or substantially equivalent).

### Feed-discovery link (T014)

- **SC-016**: `/changelog` `<head>` contains `<link rel="alternate" type="application/atom+xml">`:
  ```bash
  curl -s <local>/changelog | grep -oE '<link[^>]*rel="alternate"[^>]*type="application/atom\+xml"[^>]*>'
  ```
  Output should show `href="https://bristle.vercel.app/changelog.atom"` + `title="Bristle changelog feed"`.

### Slice-005 nav + footer Changelog link regression check (T014)

- **SC-017**: from `<local>/`, click top-nav `Changelog` → lands on `/changelog` (HTTP 200; was the slice-005 `ComingSoon` soft-404). From `<local>/`, scroll to footer Product column `Changelog` → lands on `/changelog` (same flip). `git diff --stat <baseline>..HEAD -- apps/web/src/components/landing/` returns empty (top-nav and site-footer unchanged).

### Responsive sweep (T014)

- **SC-018**: sweep at 320 / 375 / 768 / 1024 / 1280 / 1440 on `/changelog` — no h-scroll, no overlap, no clipped text; two-column body collapses to single-column below `md`; ChangelogJumpNav collapses from sticky vertical rail to horizontal pill row at and below `md`; 3-col entry row (date / title+badge+body / figure-below) stacks at mobile.

### Metadata (T014)

- **SC-019**: `/changelog` `<head>` emits `<title>` `Changelog — Bristle`, meta description, `og:title`, `og:description`, `og:url` (absolute), `og:image` (absolute, slice-005 raster), `og:type` `website`, and the Atom feed-discovery `<link rel="alternate">` (per SC-016). No `<meta robots>` in body.

### Build (T014)

- **SC-021**: First Load JS for `/changelog` < 180 KB gz. Expected ~107-110 KB. If ≥ 130 KB on `/changelog`, investigate.
- **SC-022**: build output marks `/changelog` as `○ Static`. `/changelog.atom` should appear as `○ Static` when `force-static` succeeds; if Next.js classifies as `ƒ Dynamic`, document and confirm Cache-Control header still emits (acceptable per FR-034).
- **SC-023**: `pnpm typecheck && pnpm lint && pnpm --filter web build` all exit 0.
- **SC-028**: `pnpm-lock.yaml` unchanged (`git diff --stat <baseline>..HEAD -- pnpm-lock.yaml` returns empty).

### Lighthouse (T014, human-only)

- **SC-020**: Lighthouse on `/changelog` on local prod: Performance / Accessibility / Best Practices / SEO each ≥ 90. SEO 100 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag` artifact (preview-only, per the slice-009/010 precedent).

### Server/client boundary + additive-only (T014)

- **SC-025**: `grep -l "use client" apps/web/src/components/changelog/ apps/web/src/app/changelog/page.tsx apps/web/src/app/changelog.atom/route.ts` returns **exactly one** file: `changelog-jump-nav.tsx`.
- **SC-027**: `git diff --stat <baseline>..HEAD --` shows zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact,legal,blog}/`, `apps/web/src/lib/`, `apps/web/src/app/{contact,blog}/`, `packages/`, or `design/`. Additive only — except for the wholesale rewrite of `apps/web/src/app/changelog/page.tsx` (slice-005's `ComingSoon` stub → slice-011's full Changelog page).

### Voice / tokens (T014)

- **SC-026**: greps across all new files in `apps/web/src/components/changelog/` + the two route files: zero hex literals, zero font-family strings, zero exclamation marks in user-visible copy (JS-operator carve-out applies to `ChangelogJumpNav`'s `!metaKey`, `!== 0`, etc.; Atom XML's `<?xml version="1.0"...` prolog has no exclamation), zero emoji, zero `amazing`/`awesome` register.

### Content data integrity (T014)

- **SC-029**: `CHANGELOG_ENTRIES.length === 11`. monthKey distribution: 3 entries in `may-2026`, 3 in `april-2026`, 3 in `march-2026`, 2 in `february-2026`, 2 in `january-2026`. Verbatim opening phrases per a sample of entries:
  - May 1 body starts `Initial JS bundle dropped from 264KB to 178KB`
  - April 7 body starts `Sixth source live`
  - January 28 body starts `Bristle is now publicly available.`
- **SC-030**: exactly one entry has a `figure` field — the May 8 `compare-view-supports-four-problems` entry with `figure: { caption: "compare view" }`. Verifiable by `grep -c "figure:" apps/web/src/components/changelog/changelog-entries.ts` returning `1`.

### Reviewer-side checks (T014, human-only — defer to browser walk)

- Keyboard reach on `/changelog`: Tab through ChangelogJumpNav anchors — every anchor reachable, focus rings visible, active anchor announces `aria-current="location"` (verify with screen reader if available).
- Reduced-motion walk: with OS preference ON, click a rail anchor → instant scroll, no animation. Toggle OS preference OFF mid-session → next click smooth-scrolls (fresh read per invocation).
- Modifier-key passthrough: Cmd-click (Mac) / Ctrl-click (Linux/Windows) a rail anchor → opens in new tab.
- ChangelogJumpNav mobile: at 375 width, scroll the page → active pill auto-scrolls horizontally into view in the pill row.
- ChangelogBadge visual: confirm Feature renders accent-bristle filled, Improvement renders surface-raised filled, Fix renders outlined-muted — all three legible.
- ChangelogFigure placeholder: confirm the diagonal-stripes SVG + `screenshot · compare view · 1280×720` caption renders on the May 8 entry; no other entry shows a figure.

### Preview parity (T015)

- **SC-024**: Vercel preview URL renders `/changelog` identically to local. `/changelog.atom` returns valid Atom XML on the preview hostname (re-run the SC-011 through SC-014 element-presence greps against the preview URL).
- **Slice-005 nav + footer regression check on preview**: from preview `/`, click top-nav `Changelog` → lands on live `/changelog` (was 404 pre-slice-011). Same for footer Product-column `Changelog` link.
- **Slice-006 / 008 / 009 / 010 regression checks on preview**:
  - `/pricing` Enterprise card "Contact sales" → still lands on `/contact` (slice 008).
  - `/faq` rail / accordion / bottom CTA still work (slice 006).
  - `/about` and `/contact` still render (slice 008).
  - `/terms` / `/privacy` / `/security` / `/gdpr` still render with intact TocRail behavior (slice 009).
  - `/blog` index + 7 article slugs still render with intact BlogRailToc + BlogFilterChips behavior (slice 010).
- No browser-console errors on any route.

## Production

- Vercel env already set for slices 004 / 005 / 006 / 008. **No new env vars** this slice.
- Both new surfaces prerender at build time; first paint is instant.
- **No `v0.2.0` tag** from this slice. Tier 2 ships `v0.2.0` only after all of 2.1–2.7 lands. Slice 011 is **2.5** — Tier 2 is now **6/7 main sub-slices done** (counting the interleaved 007 patch: 2.1 ✓, 2.2 ✓, 007 patch ✓, 2.3 ✓ via 008+009, 2.4 ✓ via 010, **2.5 ✓ via 011**; remaining: 2.6 Sample report detail / next-themes target, 2.7 Final wire-up).

## Notes

- **Pre-launch content review** of every `[PLACEHOLDER]` paragraph in `changelog-entries.ts` (founder edit pass) happens BEFORE Tier-2 v0.2.0 launch, NOT before slice 011 merge. Slice 011 ships with placeholders intact, marked by the file-header comment.
- **Atom feed validation**: include `xmllint --noout` as a recommended CI check in a future tooling slice. For now, the element-presence greps in SC-011 through SC-014 cover the structural correctness floor.
- **ChangelogJumpNav is the fourth structural mirror** of slice-006 `FaqScrollSpyRail` + slice-009 `TocRail` + slice-010 `BlogRailToc`. Refactor pressure for shared `SectionScrollSpyRail` is now the **highest-priority deferred follow-up** — recommend a dedicated refactor slice between Tier 2 ship (after 2.7) and Tier 3 start, or batch into 2.7.
- **No new known-out-of-scope-404 destinations** introduced by slice 011 (unlike slice 009's `/privacy/sub-processors`). The Atom feed at `/changelog.atom` is live the moment slice 011 ships; the `RssSubscribeCard`'s only outbound link lands on a real endpoint.
- **`<baseline>` for diff commands**: the true `origin/main` SHA after the slice-010 merge is `f434f44` (verified via gh API). Use that as the explicit baseline for any `git diff --stat <baseline>..HEAD` commands; the local `origin/main` tracking ref may or may not be current depending on whether SSH fetch has succeeded since session start.
