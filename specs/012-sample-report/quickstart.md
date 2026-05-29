# Quickstart — Gate Recipe + SC Mapping

Run these gate checks at STOP-4 (T021 local + T022 preview parity).

## T-local — pnpm gates

```sh
pnpm typecheck                              # SC-013
pnpm lint                                   # SC-013
pnpm --filter web build                     # SC-013 + SC-014 (read First Load JS per route from output)
```

Expected build output: 5 `/problems/[slug]` routes printed as `● (SSG)` with First Load JS each < 180 KB gz (~110-115 KB).

## T-local — route smoke (5 prerendered + 1 not-found)

```sh
pnpm --filter web start &       # serve the production build
WEB_PID=$!
sleep 3
for slug in stripe-webhooks-vercel-cold-starts \
            webhook-ordering-on-retries \
            llm-streaming-cdn-buffering \
            expo-ota-ios-18-4 \
            pgvector-index-degradation-2m; do
  status=$(curl -so /dev/null -w "%{http_code}" "http://localhost:3000/problems/$slug")
  echo "$slug → $status"
done
echo "unknown-slug → $(curl -so /dev/null -w "%{http_code}" "http://localhost:3000/problems/this-does-not-exist")"
kill $WEB_PID
```

Expected: 5 × `200` + `404` for the unknown slug (SC-002, SC-012).

## T-local — link-flip regression on slice-005 SampleReports

```sh
pnpm --filter web start &
WEB_PID=$!
sleep 3
curl -s "http://localhost:3000/" | grep -oE 'href="/problems/[^"]+"' | sort -u
kill $WEB_PID
```

Expected output: 3 distinct hrefs pointing at the 3 seed-flip stubs (`llm-streaming-cdn-buffering`, `expo-ota-ios-18-4`, `pgvector-index-degradation-2m`). All 3 destinations must return HTTP 200 (SC-005).

## T-local — visual diff vs design

```sh
# Capture a screenshot of /problems/stripe-webhooks-vercel-cold-starts at 1280×N
# Compare to design/Public_pages.pdf page 7 within 4px (SC-001)
```

## T-local — Lighthouse on the full Stripe route

```sh
pnpm --filter web start &
WEB_PID=$!
sleep 3
npx lighthouse http://localhost:3000/problems/stripe-webhooks-vercel-cold-starts \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless" --quiet
kill $WEB_PID
```

Expected: all 4 categories ≥ 90 on local prod (SC-015). On Vercel preview, SEO 60 is the documented `noindex` artifact.

## T-local — discipline greps

```sh
# Zero hex literals in new files (SC-016)
grep -rEn "#[0-9a-fA-F]{3,8}" apps/web/src/components/problem/ apps/web/src/app/problems/

# Zero font-family literals (SC-016)
grep -rEn "font-family" apps/web/src/components/problem/ apps/web/src/app/problems/

# Zero exclamations in user-visible copy (SC-016) — exclude TS operator usage
grep -rEn '!' apps/web/src/components/problem/ apps/web/src/app/problems/ | grep -vE '!==?|!\w|\.|\?|;'

# Zero emoji glyphs (SC-016)
grep -rPn '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' apps/web/src/components/problem/ apps/web/src/app/problems/

# Single client island (SC-017)
grep -l '"use client"' apps/web/src/components/problem/ apps/web/src/app/problems/
# Expected: only apps/web/src/components/problem/frequency-chart.tsx

# No dark-mode class names (SC-020)
grep -rEn "dark:|data-theme" apps/web/src/components/problem/ apps/web/src/app/problems/
```

## T-local — slice integrity

```sh
# Zero modifications outside slice-012 dirs (SC-018)
git diff --stat origin/main -- '!specs/' \
  | grep -vE "apps/web/src/(components/problem/|app/problems/)" \
  | grep -v "^$"
# Expected: empty output (or 0 lines)

# pnpm-lock.yaml unchanged (SC-019)
diff <(git show origin/main:pnpm-lock.yaml) pnpm-lock.yaml
# Expected: empty diff
```

## T-local — STOP-1 count cross-check (per plan §15)

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

Expected: 5 / 1 / 4 / 4 / 4 / 4 / 2 / 5.

## T-preview-parity — Vercel preview

```sh
# Push branch (use gh-token HTTPS if SSH agent stale — slice-011 carry-forward pattern)
git push -u origin 012-sample-report

# Open the PR or wait for Vercel preview URL from CI
PREVIEW_URL="<the Vercel preview URL>"

for slug in stripe-webhooks-vercel-cold-starts \
            webhook-ordering-on-retries \
            llm-streaming-cdn-buffering \
            expo-ota-ios-18-4 \
            pgvector-index-degradation-2m; do
  status=$(curl -so /dev/null -w "%{http_code}" "$PREVIEW_URL/problems/$slug")
  echo "$slug → $status"
done
```

Expected: all 5 × `200` on preview (SC-021).

## SC mapping (full)

| SC | Check |
|---|---|
| SC-001 | Visual diff vs design page 7 at 1280 (4px tolerance) |
| SC-002 | 4 stub routes return 200 |
| SC-003 | Build output shows 5 `● (SSG)` for `/problems/[slug]` |
| SC-004 | Each route's `<head>` has `<title>`, `<meta name="description">`, `og:type="article"`, `og:image` |
| SC-005 | Landing curl shows 3 hrefs; all 3 destinations return 200; sample-reports.tsx unchanged in git diff |
| SC-006 | Click each of 4 time-range buttons in dev tools; verify SVG path re-renders; verify `aria-pressed` flips |
| SC-007 | Donut renders 4 `<path>` elements; per-segment `<title>` present; aria-label includes "GitHub: 26 quotes (55%)" or equivalent |
| SC-008 | Evidence section contains 8 card-like elements (5 + 2 + 1) |
| SC-009 | EvidenceCTA anchor `href="/signup"` |
| SC-010 | SampleBanner anchor `href="/signup"` |
| SC-011 | Save / Share buttons present in DOM, no `onClick` attribute, no client state |
| SC-012 | Breadcrumb plain text " / " — zero `<a>` tags in the breadcrumb |
| SC-013 | `/problems/unknown-slug` returns 404 |
| SC-014 | pnpm typecheck/lint/build exit 0 |
| SC-015 | First Load JS < 180 KB on all 5 routes |
| SC-016 | Lighthouse ≥ 90 on Stripe route |
| SC-017 | Discipline greps clean (hex / font-family / `!` / emoji / hype) |
| SC-018 | Exactly 1 `"use client"` file under `apps/web/src/components/problem/` |
| SC-019 | git diff --stat clean outside slice-012 dirs |
| SC-020 | pnpm-lock.yaml unchanged |
| SC-021 | Vercel preview renders all 5 routes identically |

## Architectural precedent (new this slice)

> Page-level full-bleed elements that must sit above `TopNav` (e.g. sample banners, announcement bars) compose at the route's JSX as siblings **BEFORE** `<TopNav />`, NOT inside or above the shared chrome. See `/problems/[slug]/page.tsx` for the canonical shape.

```tsx
<>
  <YourAboveNavChrome />   {/* sits outside the standard shell */}
  <TopNav />
  <main>...</main>
  <SiteFooter />
</>
```

The pattern is purely additive — it does not require touching `top-nav.tsx`, `site-footer.tsx`, or the root layout. Future slices that need similar treatment follow this precedent.
