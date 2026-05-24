# Quickstart / Verification: Slice 008

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (already done at plan time)

- PR #6 (slice 007) merged to `main` via merge commit `e9e75a4`.
- `008-about-and-contact` cut from clean `main` (no stacking; branch is 1 commit ahead — the spec commit `c98587d`).
- `resend` + `zod` confirmed not yet anywhere in the workspace (clean dep tree).
- `apps/web/.env.example` confirmed not yet present (will be created at T002).
- Slice-005 footer's Company column already links to `/about` (line 16) + `/contact` (line 18) — no footer edit this slice.

## Local

```bash
pnpm install                                          # picks up resend + zod after T001
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # /, /pricing, /faq, /about, /contact all render
```

No DB env required — both new pages are content-static. The contact form's Server Action runs server-side; if the three Resend env vars are unset locally (which they will be unless `apps/web/.env.local` is created and populated), the form returns its inline error banner on submit — which is the **expected** ship state.

## Acceptance checks (map to SC-001 … SC-023)

### Visual & responsive
- **SC-001** — `/about` (local prod build) visual-diff vs `design/Public_pages.pdf` p.2 within 4px per section (hero · byline · 5 body paragraphs · pull-quote · founder card · newsletter stub · footer).
- **SC-002** — `/contact` (local prod build) visual-diff vs `design/Public_pages.pdf` p.9 within 4px per section (hero · 3 path cards w/ icon + label + subtitle + chevron · form card w/ name/email/topic/message + submit + caption · footer).
- **SC-020** — Vercel preview deploy renders both pages identically to local within 4px; browser console clean on both routes; form preview demonstrates graceful-degradation (env vars not set → inline error banner on submit, no 500).
- Responsive sweep at 320/375/768/1024/1280/1440 — both pages: no h-scroll / overlap / clipped text; `/contact` collapses to single column below `md` with paths-first then form.

### Form behavior (Contact)
- **SC-003** — form in default ship state (env vars unset): submit valid input → inline error banner renders ("Could not send right now…"), no 500, no client console error, visitor inputs preserved in form fields.
- **SC-004** — form when env vars set: submit valid input → email arrives at `CONTACT_FORM_RECIPIENT` with form fields in plain-text body + visitor's email as `Reply-To`; success state renders ("Message sent." + goodbye copy).
- **SC-005** — server-side zod validation: empty Name / empty Email / invalid email / unselected Topic / Message <10 chars or >2000 chars → inline field errors via `aria-describedby`, no email sent.
- **SC-006** — JS-disabled walk: open `/contact` with JavaScript off in the browser → submit valid input → server-rendered response shows same success/error/validation states as JS-enhanced flow.
- **SC-007** — keyboard walk: Tab order is name → email → topic → message → submit; focus rings visible at every step; topic `<select>` operable with arrow keys (native behavior); ESC does nothing special on the form (only the accordion has ESC behavior, in slice 006).

### Footer link (no change this slice — verify regression)
- `apps/web/src/components/landing/site-footer.tsx` is unchanged; existing Company column links `/about` and `/contact` continue to work (now reach real pages instead of 404 + the existing slice-005 stub).

### Metadata, voice, tokens
- **SC-008** — `/about` head: `<title>About — Bristle</title>`, meta description present, `og:title` + `og:description` + `og:url` (`https://bristle.vercel.app/about`) + `og:image` (absolute, slice-005 raster) present; **no `<meta name="robots">`** in body. Same checks for `/contact` with `Contact — Bristle`.
- **SC-021** — grep `apps/web/src/components/about/`, `apps/web/src/components/contact/`, `apps/web/src/app/about/page.tsx`, `apps/web/src/app/contact/page.tsx`, `apps/web/src/app/contact/actions.ts`, `apps/web/src/lib/resend.ts`: zero `#[0-9A-Fa-f]{3,8}` hex literals; zero `font-family`/`font-name` string literals; zero exclamation marks in user-visible copy (em-dashes OK); zero emoji; zero "amazing/awesome" register.

### Architecture
- **SC-022** — server/client split: `grep -l "use client" apps/web/src/components/about apps/web/src/components/contact apps/web/src/app/about/page.tsx apps/web/src/app/contact/page.tsx apps/web/src/app/contact/actions.ts apps/web/src/lib/resend.ts` returns **exactly one** file: `apps/web/src/components/contact/contact-form.tsx`. Both route entries are `async function` (no `"use client"`).
- **SC-023** — additive-only: `git diff --stat origin/main..HEAD` shows no changes under `apps/web/src/components/landing/`, no changes to `packages/`, no changes to slice-006 pricing/FAQ files, no changes to `design/`. Only modifications to existing-on-main files: wholesale replacement of `apps/web/src/app/about/page.tsx`, `apps/web/package.json` (+2 deps), `pnpm-lock.yaml` (transitive update).

### Build & budget
- **SC-016** — `pnpm typecheck && pnpm lint && pnpm --filter web build` exit 0.
- **SC-010** — build output: `/about` is `○ Static`. `/contact` is `○ Static` OR `ƒ Dynamic` — both acceptable; document the actual choice here after first successful build.
- **SC-017** — `/about` First Load JS < 180 KB gz. Expected: ~107-108 KB (baseline + content; no client components).
- **SC-018** — `/contact` First Load JS < 180 KB gz. Expected: ~110-112 KB (baseline + ContactForm ~1-2 KB + lucide ChevronRight ~0.5 KB; **zod must be server-only** — if `/contact` is ~130 KB+, zod was accidentally bundled to the client; investigate `contact-form.tsx` imports).
- **SC-019** — Lighthouse on local prod build for `/about` and `/contact`: Performance / Accessibility / Best-Practices / SEO each ≥ 90. SEO 100 on local-prod; SEO 60 on preview (Vercel `x-robots-tag: noindex` artifact, not a regression).

### Dependency check (Batch A gate)
- **SC-011** — `apps/web/package.json` includes `resend ^6.12.3` + `zod ^4.4.3` in `dependencies`; `pnpm-lock.yaml` updated.
- `pnpm why resend` shows the package + its transitive deps (no surprises).
- `pnpm why zod` shows zod + transitive (zod is dep-free in modern versions — should be a leaf).

### Env contract (Batch A gate)
- **SC-012** — `apps/web/.env.example` exists; documents `RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, `CONTACT_FORM_FROM` with explanatory comments each.

### Resend helper (Batch A gate)
- **SC-013** — `apps/web/src/lib/resend.ts` exists; starts with `import "server-only"`; exports `sendContactMessage` with the documented `Promise<{ ok: true } | { ok: false; reason }>` return shape; runtime env-var-presence check returns `{ ok: false, reason: "not-configured" }` when any of the three vars is missing or empty.

### Content data (Batch A gate)
- **SC-014** — `apps/web/src/components/about/about-content.ts` exists with the 5 paragraphs + pull-quote + founder data + byline data per FR-002 / FR-003 / FR-004; header comment marks the content as `[PLACEHOLDER — review before production launch]`.
- **SC-015** — `apps/web/src/components/contact/contact-paths.ts`, `contact-topics.ts`, and `contact-schema.ts` all exist with the documented shapes; addresses in `contact-paths.ts` are flagged with the `[PLACEHOLDER — review DNS/email setup before production launch]` comment.

## Production

- Vercel env already set for slices 004 / 005 / 006 / 007. **Slice 008 requires three new env vars** added to the Vercel project Production environment:
  - `RESEND_API_KEY`
  - `CONTACT_FORM_RECIPIENT`
  - `CONTACT_FORM_FROM`
- **Before flipping the form live**: verify the `bristle.dev` domain in Resend (SPF + DKIM records); confirm `CONTACT_FORM_RECIPIENT` is a real inbox; trigger a redeploy after env vars land.
- The slice ships with graceful degradation if any env var is missing — the form returns the inline error banner instead of crashing. No code change required to flip on after DNS verification completes.
- No `v0.2.0` tag from this slice. Tier 2 ships `v0.2.0` only after all of 2.1–2.7 lands; slice 008 is part-of-2.3 (with slice 009 covering the legal pages). The wait continues.

## Notes

- **Form submission walked in both env-var states** at T021: state A (env vars unset → error banner), state B (env vars set locally via `apps/web/.env.local` → success + actual email delivered). State A is the canonical ship state.
- **JS-disabled walk** at T021 confirms the progressive-enhancement contract (FR-011 / AC US2-5).
- **Founder pre-launch review** of all `[PLACEHOLDER]` content (About body, founder bio, contact-paths addresses) happens before the Tier-2 `v0.2.0` tag — NOT before slice 008 merge. Slice 008 ships with placeholders intact, marked as such in source.
