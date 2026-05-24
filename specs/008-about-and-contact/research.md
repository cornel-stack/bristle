# Research: About + Contact + Resend integration

Phase 0 decisions (the 13 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: thin server entry + per-section components, mirroring slices 005 / 006

- **Decision**: `about/page.tsx` and `contact/page.tsx` are thin async Server Components composing per-section files under `apps/web/src/components/{about,contact}/`. About sections: hero, body, founder-card, newsletter-stub. Contact sections: hero, contact-paths, contact-form (client). Each route wraps its sections in `<main>` between the slice-005 `TopNav` and `SiteFooter`.
- **Rationale**: maps 1:1 to spec sections + per-section 4px gate; small reviewable diffs; matches slice-005 / 006 pattern exactly. `<main>` wrap from day one (slice-005 follow-up acknowledged but not fixed here).
- **Alternatives**: single inline `page.tsx` per route — rejected (200+ lines each, unreviewable per section).

## D2 — Server vs Client boundary: 1 client file, 16+ server files

- **Decision**: only `apps/web/src/components/contact/contact-form.tsx` carries `"use client"` (it owns `useActionState`). Everything else — both route entries, all four About sections, the two Contact non-form sections, the success/error helper components, the Server Action, and the Resend helper — is server-rendered or server-only.
- **Rationale**: keeps client JS minimal (~1-2 KB user code on `/contact`, zero on `/about`); server-side validation + server-rendered success/error markup means JS-disabled submission works (FR-011 / AC US2-5) without any client code; satisfies §5 perf budgets.
- **Alternatives**: client-side validation in the form (rejected — would force zod onto the client bundle and duplicate the validation logic); per-section client components for form-success / form-error (rejected — they're pure JSX, no need).

## D3 — Server Action state: two error variants, not one

- **Decision**: `ContactFormState = { status: "idle" } | { status: "success" } | { status: "validation-error"; fieldErrors; values } | { status: "transport-error"; values }`. Not a single `"error"` with a `reason` subfield. Server Action signature: `submitContactForm(prevState, formData): Promise<ContactFormState>`. `"submitting"` is omitted (use `useActionState`'s pending boolean instead). `"not-configured"` collapses into `"transport-error"` per the spec edge case ("the not-configured case and the send-failed case both surface the same error banner").
- **Rationale**: focus management (D7) needs to discriminate validation vs transport at the type level — the focus useEffect switches on `status`, not on a nested `reason`. Two separate top-level statuses keeps the switch type-safe. Values preservation on both error variants matches the spec edge case (form preserves user input on validation/transport error).
- **Alternatives**: single `"error"` status with `reason: "validation" | "transport"` (rejected — pushes the discriminator into a nested field, complicates the focus useEffect); separate top-level statuses for `"not-configured"` and `"transport"` (rejected — visitor doesn't need to distinguish; same banner copy; spec edge case explicitly says collapse).

## D4 — Zod schema: kebab-case enum keys + plain-language error messages + server-only runtime

- **Decision**: `contactFormSchema` at `apps/web/src/components/contact/contact-schema.ts`. Fields: `name: z.string().trim().min(1).max(100)`, `email: z.string().trim().toLowerCase().email()`, `topic: z.enum(CONTACT_TOPIC_KEYS)`, `message: z.string().trim().min(10).max(2000)`. Each field has a plain-language error message override (e.g. "Please add your name.", "A few more words help us reply usefully."). Topic enum keys are kebab-case (`product-question`, `bug-report`, etc.); display labels live separately in `contact-topics.ts`.
- **Rationale**: trim+lowercase on email handles the normalization edge case (whitespace + casing); plain-language error strings are user-visible copy and should match voice §6 (zod defaults like "Required" are too brusque); keys-vs-labels separation lets the display strings change without breaking the enum or the data layer. `import type` from `contact-form.tsx` keeps zod runtime server-only.
- **Alternatives**: defaults-only error messages (rejected — voice §6); display labels as enum keys (rejected — `"Product question"` as an enum key is awkward to type and tightly couples the i18n surface to the data layer).

## D5 — Resend client: runtime env-var check + per-call SDK client + `import "server-only"`

- **Decision**: `apps/web/src/lib/resend.ts` exports `sendContactMessage()` returning `Promise<{ ok: true } | { ok: false; reason: "not-configured" | "transport" }>`. Reads `RESEND_API_KEY` / `CONTACT_FORM_RECIPIENT` / `CONTACT_FORM_FROM` from `process.env` **inside the function** on every call (not memoized). When all three are present, constructs `new Resend(apiKey)` **per call** (not singleton). Top of file: `import "server-only"`.
- **Rationale**:
  - Runtime check (not memoized) → env vars can flip in Vercel without redeploy; a memoized at-startup check would lock in not-configured even after env vars land.
  - Per-call SDK client (not singleton) → SDK is a thin HTTP wrapper (no connection pool, no persistent state); no measurable perf delta.
  - `import "server-only"` → Next.js build-time guard against accidental bundling to the client (which would expose the API key).
- **Alternatives**: singleton with lazy init (rejected — memoization concern); module-level env capture at first import (rejected — cached forever, breaks the post-deploy env-var flip); throwing on missing env (rejected — would 500 instead of the graceful banner per clarification (a)).

## D6 — Email body: plain-text + dot-separator + reply-to = visitor's email

- **Decision**: Subject `Bristle contact: {topic-label} from {name}`. Body text/plain: four labeled metadata lines (`Name: …`, `Email: …`, `Topic: …`, blank, `--`, blank, message verbatim). `replyTo` = visitor's normalized email. `from` = `CONTACT_FORM_FROM`. `to` = `CONTACT_FORM_RECIPIENT`.
- **Rationale**: subject with topic-and-name lets the founder triage from the inbox list view. Plain text avoids HTML escaping concerns and improves deliverability. `--` is the universal email separator. `replyTo = visitor.email` is the killer founder-UX feature: hitting reply in the inbox replies to the visitor, not to `contact@bristle.dev` (which is a no-reply transactional sender).
- **Alternatives**: HTML body (rejected — escaping, deliverability tradeoff); no `replyTo` (rejected — founder would have to copy-paste from body); subject with just `Bristle contact form` (rejected — useless for triage).

## D7 — Focus management: useEffect on status, refs not data-test

- **Decision**: `useEffect` on `[state]` discriminating on `state.status`. On `"validation-error"`: focus first field with an error, in form-tab-order (`name → email → topic → message`). On `"transport-error"`: focus the error banner (which is `tabIndex={-1}` for programmatic focus). On `"success"`: focus the success heading (also `tabIndex={-1}` + `role="status"` `aria-live="polite"`).
- **Rationale**: `useRef` is the React-idiomatic way to address DOM nodes; `data-test` attributes are for tests, not for application-internal addressing. `tabIndex={-1}` lets SR users hear the announcement without disturbing the tab cycle. First-render `"idle"` state is a no-op so we don't yank focus on page load.
- **Alternatives**: `document.querySelector` calls (rejected — fragile, escapes React's render tree); `autoFocus` on the success heading (rejected — React's autoFocus only fires on mount, not on conditional render swaps).

## D8 — Mobile breakpoints: md = 768, paths-first on Contact, 375 in the visual gate

- **Decision**: `/about` single-column at all widths (no breakpoint logic). `/contact` body is `grid md:grid-cols-2 gap-section`; below `md` collapses to single column with DOM order paths → form (matches natural reading + spec clarification (d)). Visual-diff gate at T019 screenshots both pages at the design viewport (1280) **and** at 375 for mobile reflow.
- **Rationale**: paths-first on mobile matches "visitor decides which channel before they engage" — they may want the email link, not the form. No `order` utility needed because DOM order already matches the desired stack order. 375 covers iPhone-class widths; 320 (the smallest in the spec's responsive sweep) is verified via the full sweep at T019 but not screenshot-diffed against the PDF (the PDF is desktop-only).
- **Alternatives**: form-first on mobile (rejected — clarification (d)); `order-1 md:order-2` swap (rejected — unnecessary, DOM order already correct).

## D9 — Per-page metadata: SITE_URL from @bristle/shared, slice-005 OG reused

- **Decision**: Both routes export `metadata` consuming `SITE_URL`. Titles: `About — Bristle`, `Contact — Bristle`. Descriptions: one sentence each in §6 voice (`"Bristle is multi-source problem discovery for builders. Made with evidence, not vibes."`, `"Email, enterprise sales, or send us a message. One inbox, one business day."`). `og:url` per route. `og:image` = slice-005 raster reused. **No `robots` field** → both pages indexable.
- **Rationale**: same pattern as slice 006; single source of truth (`SITE_URL`); absolute URLs survive preview-host social shares.
- **Alternatives**: per-page OG raster (rejected — no new image authored this slice); relative `og:image` (rejected — breaks on preview origins).

## D10 — Perf budget: zod server-only, lucide by name, no on-page raster, no on-page client JS on /about

- **Decision**: `zod` runtime is server-only (`contact-form.tsx` uses `import type` for `ContactFormInput`; the Server Action does the validation). `lucide-react` icons (`LifeBuoy`, `Mail`, `Zap`, `ChevronRight`) imported by name only — Next 15 tree-shakes. `resend` is server-only via `import "server-only"` in `lib/resend.ts`. No new fonts. No on-page rasters. `/about` has zero client components.
- **Rationale**: Expected `/about` First-Load JS ≈ slice-005 stub baseline (~106 KB) + 1-2 KB content. `/contact` adds the form (~1-2 KB user code) + lucide chevron (~0.5 KB). Both well under the 180 KB gz budget.
- **Alternatives**: zod on the client for preview validation (rejected — would push `/contact` to ~130 KB and duplicate the validation logic; native HTML attributes provide adequate preview validation).

## D11 — Test surface: gates only; Vitest deferred

- **Decision**: same as slices 005 / 006 — gates only (typecheck/lint/build, Lighthouse, responsive sweep, keyboard walk, hex/font/voice greps, visual-diff vs PDF). Form submission walked in both env-var states + JS-disabled walk.
- **Rationale**: Playwright not wired; Vitest harness for Server Actions is non-trivial (monorepo + Next.js module resolution + jsdom). Slice 008 is not the right place to land that infra.
- **Alternatives**: add Vitest harness this slice (rejected — scope creep; the Server Action is small enough that manual walks are adequate); add Playwright this slice (rejected — even bigger scope creep).

## D12 — Risks: see plan §"Risks, unknowns & tracked follow-ups" (R1-R10)

The risk table in plan.md captures: visual fidelity (R1), new-deps acceptance (R2), client-bundle bloat from zod (R3) or resend (R4), Server Action complexity creep (R5), grep cleanliness (R6), JS-disabled regression (R7), Resend DNS verification status (R8), bundle budget (R9), newsletter-stub duplication drift (R10). Tracked follow-ups: spam protection, Resend domain verification, Vitest harness, NewsletterStub convergence, slice-005 `<main>`, `/api/contact` route handler.

## D13 — Batching: 4 batches / 4 STOPs, mirroring slice 006

- **Decision**:
  - Batch A: deps + env example + content data + Resend helper (~5 commits + verify).
  - Batch B: Server Action + form primitives (~4 commits).
  - Batch C: server section components + routes (~8 commits).
  - Batch D: gates (no commits).
  Expected ~19-20 commit-producing tasks total + 2 verification gates.
- **Rationale**: 4-batch shape mirrors slice 006 which had similar surface area (new pages + new dep + interactive components). Single-batch (slice 007 shape) is overkill compression for this scope; 2-batch would conflate the foundations + interactive surface review.
- **Alternatives**: 3 batches (rejected — conflating server-action+primitives with sections is unreviewable per-section); 5 batches (rejected — over-segmenting; the Resend helper naturally pairs with the content data files since both are server-only foundations).
