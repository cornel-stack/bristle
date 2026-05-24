# Tasks: About + Contact + Resend integration

**Input**: `spec.md` + `plan.md` + `research.md` + `contracts/ui-and-db.md` + `quickstart.md` in `specs/008-about-and-contact/`
**Branch**: `008-about-and-contact`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slices 005 / 006 / 007). Verification is the gate phase — typecheck/lint/build, First-Load JS budgets, `pnpm why` dep-tree audits, hex/font/voice/CTA/metadata greps + curls, route 200 + meta-tag checks, form submission walk in **both** env-var states (graceful-degradation in state A, real Resend send in state B), JS-disabled walk, keyboard reach walk, responsive sweep 320→1440, 4px-tolerance visual-diff vs `Public_pages.pdf` p.2 + p.9 at **1280 AND 375** widths, and preview parity. Server Action testable in principle via Vitest; deferred per plan §11.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (visitor reads About + learns who's behind it), US2 (visitor uses Contact form including graceful-degradation), US3 (perf / a11y / SEO / voice / responsive floors), or SETUP.
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: four batches, each ending in **one STOP** for review (per slice-006 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #6 (slice 007) merged to `main` via merge commit `e9e75a4` on 2026-05-23; `008-about-and-contact` cut from clean `main` (no stacking this round, unlike 006 → 007); branch is currently 3 commits ahead (`c98587d` spec + `db0ea6d` plan-and-artifacts + `676d5b2` plan-fixup); working tree clean. Both `resend` and `zod` confirmed not yet present anywhere in the workspace (clean dep tree at plan time). `apps/web/.env.example` confirmed not yet present. Slice-005 footer's Company column already links `/about` (line 16) and `/contact` (line 18) — no footer edit this slice.
- **Additive-only with two recorded exceptions**: (1) wholesale replacement of `apps/web/src/app/about/page.tsx` (slice-005 stub → full page) per FR-001 — same shape as slice 006 replacing `/pricing`; (2) two new top-level deps in `apps/web/package.json` per FR-017. Slice-005 `top-nav.tsx` / `site-footer.tsx`, slice-006 pricing/FAQ files, design tokens, `ProblemCardFull`, `ProblemCardCompact`, `@bristle/db`, and `design/` are all **NOT modified** (FR-025).
- **Boundary reminder**: `/about/page.tsx` and `/contact/page.tsx` are async Server Components; only **one** new file carries `"use client"` — `apps/web/src/components/contact/contact-form.tsx` (plan §2). `lib/resend.ts` starts with `import "server-only"` to belt-and-suspender against accidental client-import (plan §5).

---

## Batch A — deps + env doc + content data + Resend wrapper  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] Add `resend` + `zod` to `apps/web/package.json` dependencies
Edit `apps/web/package.json`: add `"resend": "^6.12.3"` and `"zod": "^4.4.3"` to `dependencies` (alphabetical insertion). Run `pnpm install` to update `pnpm-lock.yaml`. Both are §9.5 propose-and-accept additions per plan Constitution Check (`resend` named in CLAUDE.md §3 as locked email provider; `zod` mandated by §5).
- **Files**: `apps/web/package.json`, `pnpm-lock.yaml`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `pnpm why resend` (run from `apps/web/`) shows `resend ^6.12.3` as a direct dep; `pnpm why zod` shows `zod ^4.4.3` as a direct dep; `pnpm-lock.yaml` regenerated (`git diff --stat pnpm-lock.yaml` shows changes).
- **Commit**: `chore(web): add resend ^6.12.3 + zod ^4.4.3 dependencies (slice 008)`

### T002 · [P] [SETUP] Create `apps/web/.env.example`
Create `apps/web/.env.example` documenting all three Resend env vars per plan / contracts. Each var gets a one-paragraph comment explaining its purpose and a placeholder default (commented out). Per FR-018.
- **Files**: `apps/web/.env.example`
- **Depends on**: —
- **Verify**: file exists; `grep -c "RESEND_API_KEY\|CONTACT_FORM_RECIPIENT\|CONTACT_FORM_FROM" apps/web/.env.example` returns 3; each var line is preceded by an explanatory comment; the file mentions graceful-degradation behavior so a reader unfamiliar with the slice understands what happens when vars are missing.
- **Commit**: `chore(web): add .env.example documenting Resend contact-form vars (slice 008)`

### T003 · [P] [US1] `about-content.ts` (5 paragraphs + pull-quote + founder + byline)
Create `apps/web/src/components/about/about-content.ts` exporting `interface AboutByline`, `interface AboutFounder`, `interface AboutContent`, and `const ABOUT_CONTENT: AboutContent` with the **verbatim** content from spec FR-002 / FR-003 / FR-004: the byline (`PUBLISHED 2026-05-24 · By Cornel Okoth · 3 min read`), the five paragraphs in display order, the one pull-quote with `pullQuoteInsertAfterParagraph: 1` (renders the blockquote after paragraph 2), the founder data (`initials: "CO"`, `name: "Cornel Okoth"`, full bio per FR-004). The file MUST begin with a `// [PLACEHOLDER — review before production launch]` header comment per FR-006.
- **Files**: `apps/web/src/components/about/about-content.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `ABOUT_CONTENT.paragraphs.length === 5`; `ABOUT_CONTENT.pullQuoteInsertAfterParagraph === 1`; `ABOUT_CONTENT.founder.initials === "CO"`; the file's first line is the `[PLACEHOLDER — review before production launch]` comment; verbatim check on paragraph 1 ("Bristle began with a small, honest frustration. …") and the pull-quote text against the spec; voice grep on the file → no `!`, no emoji, no "amazing"/"awesome".
- **Commit**: `feat(web): add about-content with 5 paragraphs + pull-quote + founder data (slice 008)`

### T004 · [P] [US2] `contact-topics.ts`
Create `apps/web/src/components/contact/contact-topics.ts` exporting `const CONTACT_TOPIC_KEYS = ["product-question", "bug-report", "enterprise-inquiry", "press-or-other"] as const`, `type ContactTopic = (typeof CONTACT_TOPIC_KEYS)[number]`, and `const CONTACT_TOPIC_LABELS: Record<ContactTopic, string>` mapping each kebab-case key to its display label per spec FR-010.
- **Files**: `apps/web/src/components/contact/contact-topics.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `CONTACT_TOPIC_KEYS.length === 4`; `CONTACT_TOPIC_LABELS["product-question"] === "Product question"` and likewise for the other three; type `ContactTopic` is the union of the four key strings.
- **Commit**: `feat(web): add contact-topics with 4 topic keys + display labels (slice 008)`

### T005 · [P] [US2] `contact-paths.ts` (3 ContactPath constants + PLACEHOLDER header)
Create `apps/web/src/components/contact/contact-paths.ts` exporting `interface ContactPath` and `const CONTACT_PATHS: readonly ContactPath[]` with the three entries from spec FR-009 (Help center → `/faq` with `LifeBuoy` icon, Email support → `mailto:support@bristle.dev` with `Mail` icon, Enterprise sales → `mailto:sales@bristle.dev` with `Zap` icon — verbatim subtitles per spec). The file MUST begin with a `// [PLACEHOLDER — review DNS/email setup before production launch]` header comment per FR-016 flagging the `support@bristle.dev` and `sales@bristle.dev` addresses.
- **Files**: `apps/web/src/components/contact/contact-paths.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `CONTACT_PATHS.length === 3`; each entry has `label`, `subtitle`, `iconName` (`"LifeBuoy" | "Mail" | "Zap"`), `href`; hrefs are exactly `/faq`, `mailto:support@bristle.dev`, `mailto:sales@bristle.dev`; the file's first line is the `[PLACEHOLDER — review DNS/email setup before production launch]` comment; voice grep clean.
- **Commit**: `feat(web): add contact-paths with 3 path cards + PLACEHOLDER address header (slice 008)`

### T006 · [P] [US2] `contact-schema.ts` (zod schema with plain-language errors)
Create `apps/web/src/components/contact/contact-schema.ts` per plan decision §4. Import `z` from `zod` and `CONTACT_TOPIC_KEYS` from `./contact-topics`. Export `contactFormSchema` (a `z.object` with `name`/`email`/`topic`/`message` fields per FR-012, each carrying a plain-language error message in §6 voice — see decision §4 sketch in plan for exact strings). Export `type ContactFormInput = z.infer<typeof contactFormSchema>`.
- **Files**: `apps/web/src/components/contact/contact-schema.ts`
- **Depends on**: T001 (zod dep), T004 (CONTACT_TOPIC_KEYS import)
- **Verify**: `pnpm --filter web typecheck` exits 0; `contactFormSchema` is exported and is a `z.ZodObject`; `ContactFormInput` type is exported; the four field error messages match plan §4 verbatim ("Please add your name.", "That email address does not look valid.", "Please pick a topic.", "A few more words help us reply usefully.", "Name is too long.", "Message is too long."); voice grep clean on the file.
- **Commit**: `feat(web): add contact-schema with zod validation + voice error messages (slice 008)`

### T007 · [US2] `lib/resend.ts` (Resend wrapper with `import "server-only"` + runtime env check + per-call SDK client)
Create `apps/web/src/lib/resend.ts` per plan decision §5. Start the file with `import "server-only";` then `import { Resend } from "resend"`. Export `type SendContactMessageResult = { ok: true } | { ok: false; reason: "not-configured" | "transport" }` and `async function sendContactMessage(input: {…}): Promise<SendContactMessageResult>`. Inside the function: read `RESEND_API_KEY` / `CONTACT_FORM_RECIPIENT` / `CONTACT_FORM_FROM` from `process.env` on every invocation (no memoization); if any missing or empty return `{ ok: false, reason: "not-configured" }`; otherwise construct `new Resend(apiKey)` per-call (not singleton); call `resend.emails.send({to, from, replyTo: input.email, subject, text})` where subject = `Bristle contact: ${input.topic} from ${input.name}` per plan §6 and `text` is the plain-text body per the `renderEmailBody` sketch in plan §5 (4 labeled metadata lines + blank + `--` + blank + message). On Resend error or throw, `console.error(...)` and return `{ ok: false, reason: "transport" }`. On success return `{ ok: true }`.
- **Files**: `apps/web/src/lib/resend.ts`
- **Depends on**: T001 (resend dep)
- **Verify**: `pnpm --filter web typecheck` exits 0; file's first non-empty line is `import "server-only";`; `sendContactMessage` is exported with the documented Promise return type; the env-var check happens **inside** the function body (not at module load); subject string contains `Bristle contact: ` literal; body uses `\n` joined lines per the sketch; `replyTo` is set to `input.email`.
- **Commit**: `feat(web): add lib/resend with graceful-degradation contact-message helper (slice 008)`

### T008 · [SETUP] VERIFY — Batch A foundations (gate)
Run the Batch A verification checks.
- **Depends on**: T001, T002, T003, T004, T005, T006, T007
- **Verify**:
  - **Typecheck + lint**: `pnpm typecheck && pnpm lint` exit 0.
  - **Dep tree clean**: `cd apps/web && pnpm why resend` shows `resend 6.12.x` as direct dep; `pnpm why zod` shows `zod 4.4.x` as direct dep; no unexpected transitive deps surface at top of the tree.
  - **Env example**: `apps/web/.env.example` exists; all 3 vars present (`RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, `CONTACT_FORM_FROM`); each documented with a comment.
  - **about-content**: `apps/web/src/components/about/about-content.ts` has `[PLACEHOLDER — review before production launch]` header on line 1; 5 paragraphs present; pull-quote present at `pullQuoteInsertAfterParagraph: 1`; founder data complete.
  - **contact-paths**: `apps/web/src/components/contact/contact-paths.ts` has `[PLACEHOLDER — review DNS/email setup before production launch]` header on line 1; 3 entries; verbatim spec hrefs.
  - **contact-topics**: 4 keys; 4 labels; types match.
  - **contact-schema**: `contactFormSchema` exported; `ContactFormInput` type exported; voice-compliant error messages.
  - **lib/resend**: file starts with `import "server-only";`; runtime env check is inside the function (grep for `process.env.RESEND_API_KEY` inside `function sendContactMessage`); per-call `new Resend(apiKey)` (not module-level).
- **Commit**: none (verification only) — any fix is its own commit referencing the failing check.

**▸ STOP 1** — foundations ready: deps installed, env vars documented, four content data files in place, Resend wrapper exposed with graceful-degradation contract.

---

## Batch B — Server Action + form primitives  ▸ STOP 2

### Phase 3: User Story 2 (Contact form interactive surface)

### T009 · [US2] Server Action at `apps/web/src/app/contact/actions.ts`
Create `apps/web/src/app/contact/actions.ts` per plan decision §3. Start file with `"use server";`. Import `contactFormSchema, type ContactFormInput` from `@/components/contact/contact-schema`; import `sendContactMessage` from `@/lib/resend`; import `CONTACT_TOPIC_LABELS` from `@/components/contact/contact-topics`. Export `type ContactFormValues = ContactFormInput` and the **4-arm discriminated** `type ContactFormState` exactly per plan decision §3 (`{ status: "idle" } | { status: "success" } | { status: "validation-error"; fieldErrors; values } | { status: "transport-error"; values }`). Export `async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState>`: (1) extract raw fields from `formData`; (2) `contactFormSchema.safeParse(raw)`; (3) on parse failure return `{ status: "validation-error", fieldErrors: zod-issues-flattened, values: raw }`; (4) on parse success call `await sendContactMessage({…parsed, topic: CONTACT_TOPIC_LABELS[parsed.topic]})` (pass the **display label** not the kebab key to Resend per plan §5 / §6); (5) on `!result.ok` log + return `{ status: "transport-error", values: parsed }` (the `"not-configured"` reason collapses into `"transport-error"` for the client per plan §3 — the server log preserves the underlying reason for diagnostics); (6) on `result.ok` return `{ status: "success" }`.
- **Files**: `apps/web/src/app/contact/actions.ts`
- **Depends on**: T004 (CONTACT_TOPIC_LABELS), T006 (contactFormSchema), T007 (sendContactMessage)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use server";`; `ContactFormState` is a 4-arm union exactly per decision §3; `submitContactForm` signature is `(prevState: ContactFormState, formData: FormData) => Promise<ContactFormState>`; the kebab-to-label topic translation happens before the Resend call (grep `CONTACT_TOPIC_LABELS[parsed.topic]`); `"not-configured"` from Resend is mapped to `"transport-error"` for the client return (grep that the client return never contains the literal string `"not-configured"`).
- **Commit**: `feat(web): add /contact Server Action submitContactForm (slice 008)`

### T010 · [P] [US2] `contact-form-success.tsx` (server)
Create `apps/web/src/components/contact/contact-form-success.tsx` as a server component. Forward-ref the `<h2>` for parent focus-management; set `tabIndex={-1}`, `role="status"`, `aria-live="polite"`. h2 text: "Message sent." (verbatim per spec FR-015 / AC US2-3). Below: a `<p>` with "We'll be in touch within one business day. — Cornel" (verbatim). Token-styled (zero hex, zero font-family literals).
- **Files**: `apps/web/src/components/contact/contact-form-success.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; component uses `forwardRef<HTMLHeadingElement, …>` or accepts a `headingRef` prop; renders `<h2 tabIndex={-1} role="status" aria-live="polite">Message sent.</h2>` + the body `<p>`; voice grep clean (no `!`, no emoji); hex/font-family grep clean.
- **Commit**: `feat(web): add ContactFormSuccess (server, focusable success heading) (slice 008)`

### T011 · [P] [US2] `contact-form-error.tsx` (server)
Create `apps/web/src/components/contact/contact-form-error.tsx` as a server component. Forward-ref the banner `<div>` for parent focus-management; set `tabIndex={-1}`, `role="alert"`. Banner text: "Could not send right now. Email us directly at support@bristle.dev and we'll respond from there." (verbatim per spec FR-015 / AC US2-2). Token-styled error banner using `status/error` for the border + `surface/raised` background; the email address renders as a `mailto:support@bristle.dev` link with `text-accent-bristle underline`.
- **Files**: `apps/web/src/components/contact/contact-form-error.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; component accepts a `bannerRef` prop OR uses `forwardRef<HTMLDivElement, …>`; renders the banner with `tabIndex={-1} role="alert"`; the email is a `mailto:` link; banner text matches the spec verbatim; hex/font-family/voice greps clean.
- **Commit**: `feat(web): add ContactFormError (server, inline error banner) (slice 008)`

### T012 · [US2] `contact-form.tsx` (client, the only client file in slice 008)
Create `apps/web/src/components/contact/contact-form.tsx` as the **only** client component in slice 008. Start file with `"use client";`. Import `useActionState, useEffect, useRef, type FormEvent` from `react`; import `submitContactForm, type ContactFormState, type ContactFormValues` from `@/app/contact/actions`; import `type ContactFormInput` from `@/components/contact/contact-schema` (type-only — keeps zod runtime server-only per plan §10); import `CONTACT_TOPIC_KEYS, CONTACT_TOPIC_LABELS` from `@/components/contact/contact-topics`; import `ContactFormSuccess` and `ContactFormError`. Define `const INITIAL: ContactFormState = { status: "idle" }`. Component: `useActionState(submitContactForm, INITIAL)` → `[state, action, pending]`. Refs: `formRef`, `errorBannerRef`, `successHeadingRef`. `useEffect` on `[state]` per decision §7 — on `"success"` focus the success heading; on `"validation-error"` focus the first invalid field in tab-order (`["name","email","topic","message"].find(k => state.fieldErrors[k] != null)`); on `"transport-error"` focus the error banner. Render: if `state.status === "success"` render `<ContactFormSuccess headingRef={successHeadingRef}/>`; else render `<form action={action} ref={formRef} noValidate>` containing the four labeled inputs (with `aria-describedby` pointing to a `<p>` carrying the field error from `state.fieldErrors` when present), the topic `<select>` with a disabled placeholder option then the four options mapped from `CONTACT_TOPIC_KEYS`/`CONTACT_TOPIC_LABELS`, the submit button (disabled when `pending`, label `"Send message"` switching to `"Sending…"` when pending), and the caption "We respond within one business day." beside the submit button. If `state.status === "transport-error"` render `<ContactFormError bannerRef={errorBannerRef}/>` above the form. Preserve `state.values` into each field's `defaultValue` when present so user input survives error re-renders. Per spec native HTML attributes provide preview validation: `<input type="email" required maxLength={100}>`, `<input type="text" name="name" required maxLength={100}>`, `<select name="topic" required>`, `<textarea name="message" required minLength={10} maxLength={2000}>`.
- **Files**: `apps/web/src/components/contact/contact-form.tsx`
- **Depends on**: T004 (topic enum + labels), T006 (ContactFormInput type), T009 (submitContactForm action + ContactFormState type), T010 (ContactFormSuccess), T011 (ContactFormError)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; uses `useActionState(submitContactForm, INITIAL)` (grep); imports `ContactFormInput` as `import type` only (verify with `grep "import type.*ContactFormInput"`); has a `useEffect` on `[state]` discriminating on `state.status` with three branches per decision §7; form uses `<form action={action} ref={formRef} noValidate>`; topic `<select>` starts with a disabled placeholder option; submit button label swaps based on `pending`; field error `<p>` elements have `id`s that match the `aria-describedby` on their input; `state.values` is consumed as `defaultValue` on each input when present; **zod is NOT imported runtime-side** (only `import type` allowed).
- **Commit**: `feat(web): add ContactForm client (useActionState + focus management + values preservation) (slice 008)`

**▸ STOP 2** — Server Action live; form primitives (success / error / form itself) typecheck in isolation. Form not yet wired into a page (that lands in Batch C T020).

---

## Batch C — server section components + routes  ▸ STOP 3

### Phase 4: User Story 1 (About) + User Story 2 (Contact composition)

### T013 · [P] [US1] `AboutHero` section (server)
Create `apps/web/src/components/about/hero.tsx` — async Server Component. Renders eyebrow `ABOUT BRISTLE` (`text-body-sm font-medium uppercase tracking-wide text-text-secondary`), serif display headline `We build research tools for builders who hate guessing.` (`font-serif text-display-lg text-text-primary`), and the byline rendered from `ABOUT_CONTENT.byline` as a single dot-separated line beneath the headline (`PUBLISHED 2026-05-24 · By Cornel Okoth · 3 min read`). Left-aligned within the page max-width container.
- **Files**: `apps/web/src/components/about/hero.tsx`
- **Depends on**: T003 (ABOUT_CONTENT.byline)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains the three exact strings (`ABOUT BRISTLE`, `We build research tools for builders who hate guessing.`, the byline composed from `ABOUT_CONTENT.byline`); zero hex literals, zero font-family literals.
- **Commit**: `feat(web): add AboutHero (slice 008)`

### T014 · [P] [US1] `AboutBody` section (server, article semantics)
Create `apps/web/src/components/about/body.tsx` — async Server Component. Renders an `<article>` containing the five paragraphs from `ABOUT_CONTENT.paragraphs` as `<p>` elements **with the pull-quote rendered as `<blockquote>` between paragraphs `pullQuoteInsertAfterParagraph` and `pullQuoteInsertAfterParagraph + 1`** (i.e. after index 1 = between paragraphs 2 and 3 per the spec). Pull-quote styling: left accent bar (`border-l-4 border-accent-bristle pl-card`), italic serif (`italic font-serif text-body-lg text-text-primary`).
- **Files**: `apps/web/src/components/about/body.tsx`
- **Depends on**: T003 (ABOUT_CONTENT.paragraphs + pullQuote + pullQuoteInsertAfterParagraph)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders one `<article>` containing five `<p>` elements + one `<blockquote>`; the blockquote sits between the 2nd and 3rd `<p>` in DOM order; pull-quote has the accent left-border + italic serif styling; voice grep clean.
- **Commit**: `feat(web): add AboutBody with article semantics + pull-quote at insertion index (slice 008)`

### T015 · [P] [US1] `FounderCard` section (server, non-rotated accent square avatar)
Create `apps/web/src/components/about/founder-card.tsx` — async Server Component. Renders a card with an avatar tile + name + bio. **Avatar**: a `<div>` with `bg-accent-bristle`, `text-surface-card`, `size-12` (~48px), `rounded-card`, `flex items-center justify-center`, `font-serif font-medium text-h4`, containing `ABOUT_CONTENT.founder.initials` (`"CO"`). **NOT** the rotated brand-diamond (no `rotate-45`) per clarification (g) — this is a regular square. Name: `<p className="font-serif text-h3 text-text-primary">` rendering `ABOUT_CONTENT.founder.name`. Bio: `<p className="text-body-md text-text-secondary">` rendering `ABOUT_CONTENT.founder.bio`.
- **Files**: `apps/web/src/components/about/founder-card.tsx`
- **Depends on**: T003 (ABOUT_CONTENT.founder)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; avatar `<div>` has `bg-accent-bristle text-surface-card size-12` classes and **does NOT contain `rotate-45`** (grep verify); initials text is `"CO"`; name + bio render from `ABOUT_CONTENT.founder`; voice grep clean; zero hex literals.
- **Commit**: `feat(web): add FounderCard (non-rotated accent square avatar per clarification (g)) (slice 008)`

### T016 · [P] [US1] `NewsletterStub` section (server, separate component per clarification (e))
Create `apps/web/src/components/about/newsletter-stub.tsx` — async Server Component. Renders the disabled newsletter card from spec FR-005: eyebrow `FIELD NOTES — MONTHLY` (small-caps), serif heading `Get one new problem report each month.`, a `<form>` with a **disabled** email input (placeholder `you@domain.com`), a **disabled** Subscribe button, and a small caption `Subscriptions open in v0.2.7.` Card has `surface/raised` background per clarification (e) (distinct styling from the slice-005 footer inline newsletter stub). **No submit handler** — purely visual stub.
- **Files**: `apps/web/src/components/about/newsletter-stub.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains the three exact strings (`FIELD NOTES — MONTHLY`, `Get one new problem report each month.`, `Subscriptions open in v0.2.7.`); email input has `disabled` attribute; Subscribe button has `disabled` attribute; no `onSubmit` / `onClick` handlers; card background is `bg-surface-raised`; voice grep clean; zero hex literals.
- **Commit**: `feat(web): add NewsletterStub (separate from footer stub per clarification (e)) (slice 008)`

### T017 · [P] [US2] `ContactHero` section (server)
Create `apps/web/src/components/contact/hero.tsx` — async Server Component. Renders eyebrow `CONTACT` (`text-body-sm font-medium uppercase tracking-wide text-text-secondary`), serif headline `Get in touch.` (`font-serif text-display-lg text-text-primary`), and subhead `One inbox. Replies within a business day.` (`font-sans text-body-lg text-text-secondary`). Left-aligned in the left column of the desktop two-column body.
- **Files**: `apps/web/src/components/contact/hero.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains the three exact strings; voice grep clean (no `!` — `Get in touch.` is a period not an exclamation); zero hex literals.
- **Commit**: `feat(web): add ContactHero (slice 008)`

### T018 · [US2] `ContactPaths` section (server, 3 cards from CONTACT_PATHS)
Create `apps/web/src/components/contact/contact-paths.tsx` — async Server Component. Renders three cards in a vertical stack (`flex flex-col gap-grid`), one per `CONTACT_PATHS` entry. Each card: `<a href={path.href}>` containing a flex row with a lucide icon left (rendered by `iconName` → maps to `LifeBuoy | Mail | Zap` at `stroke-[1.5] size-5`), a middle text block (label `text-body-md font-medium text-text-primary` + subtitle `text-body-sm text-text-secondary`), and a lucide `ChevronRight` indicator right (`stroke-[1.5] size-5 text-text-secondary`). Card styling: `rounded-card border border-border-default bg-surface-card p-card hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`. Icon lookup: a small switch / record at the top of the file mapping each `iconName` value to its lucide component.
- **Files**: `apps/web/src/components/contact/contact-paths.tsx`
- **Depends on**: T005 (CONTACT_PATHS)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `LifeBuoy, Mail, Zap, ChevronRight` from `lucide-react` **by name** (no `import *`); renders 3 `<a>` cards mapped from `CONTACT_PATHS`; each card has icon-text-chevron layout; chevron is `ChevronRight` not a unicode arrow; voice grep clean; zero hex literals.
- **Commit**: `feat(web): add ContactPaths (3 cards with lucide icons + chevron) (slice 008)`

### T019 · [US1] `/about/page.tsx` — REWRITE wholesale + metadata
Replace `apps/web/src/app/about/page.tsx` wholesale, removing the slice-005 `<ComingSoon version="0.2.3" />` and its `robots: { index: false, follow: false }` metadata. New file: `async function About()` Server Component composing `<TopNav /> <main> <AboutHero /> <AboutBody /> <FounderCard /> <NewsletterStub /> </main> <SiteFooter />` (slice-005 `TopNav` + `SiteFooter` reused). Export `metadata: Metadata` per plan decision §9 / contracts: `metadataBase: new URL(SITE_URL)`, `title: "About — Bristle"`, `description: "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes."`, `openGraph` with same title/description + `type: "website"` + `url: SITE_URL + "/about"` + `images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }]`. **No `robots` field** → indexable.
- **Files**: `apps/web/src/app/about/page.tsx`
- **Depends on**: T013, T014, T015, T016
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export is `async function`; six components composed in order (TopNav / AboutHero / AboutBody / FounderCard / NewsletterStub / SiteFooter) inside a `<main>` wrap; the slice-005 `ComingSoon` import and noindex metadata are **gone**; metadata object has `title`, `description`, `openGraph` (with `url: SITE_URL + "/about"` and the absolute OG image), and **no `robots` field**.
- **Commit**: `feat(web): replace /about stub with full About page + metadata (slice 008)`

### T020 · [US2] `/contact/page.tsx` — ADD new route + metadata
Create `apps/web/src/app/contact/page.tsx` — brand-new route. `async function Contact()` Server Component composing `<TopNav /> <main className="mx-auto max-w-6xl px-grid py-section grid gap-section md:grid-cols-2"> <div> <ContactHero /> <ContactPaths /> </div> <ContactForm /> </main> <SiteFooter />`. Mobile (`<md`): the grid collapses to single column with DOM order **paths first, form second** per clarification (d) — natural since the left-column wrapper precedes `<ContactForm/>` in DOM order. Export `metadata: Metadata` per plan decision §9 / contracts: `title: "Contact — Bristle"`, `description: "Email, enterprise sales, or send us a message. One inbox, one business day."`, `openGraph` with `url: SITE_URL + "/contact"` and absolute OG image. **No `robots` field** → indexable.
- **Files**: `apps/web/src/app/contact/page.tsx`
- **Depends on**: T012 (ContactForm), T017 (ContactHero), T018 (ContactPaths)
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export is `async function`; composes `TopNav`, the 2-col `<main>` grid wrapper containing left = `<ContactHero/> + <ContactPaths/>` and right = `<ContactForm/>`, then `SiteFooter`; metadata has `title: "Contact — Bristle"`, `description`, `openGraph.url: SITE_URL + "/contact"`, absolute OG image, and **no `robots` field**; mobile reflow verified manually by reading the grid classes (`md:grid-cols-2` collapses to default `grid-cols-1` below `md`).
- **Commit**: `feat(web): add /contact route (full Contact page + form + metadata) (slice 008)`

**▸ STOP 3** — both routes composed end-to-end with metadata; ContactForm wired into `/contact`; both pages typecheck in isolation.

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 3 (perf / a11y / SEO / voice / responsive floors)

### T021 · [US3] VERIFY — local gate
Run the local loop + audits against the post-implementation state.
- **Depends on**: T019, T020
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-016)*
  - **First Load JS budgets (FR-008 / SC-017 / SC-018)**: `/about` target ~108 KB (expected close to slice-005 stub baseline of 106 KB + content). `/contact` target ~110-112 KB (slice-005 stub baseline + ContactForm ~1-2 KB + lucide ChevronRight ~0.5 KB). **Both < 180 KB gz**. If `/contact` is ≥ 130 KB, investigate accidental zod-on-client bundling (decision §10 / risk R3); grep `apps/web/src/components/contact/contact-form.tsx` for any non-type `zod` import.
  - **Static prerender**: build output marks `/about` as `○ Static`. `/contact` is `○ Static` OR `ƒ Dynamic` per FR-023 / SC-010 — both acceptable; **document the actual choice here** for the PR description.
  - **`server-only` enforcement**: `pnpm --filter web build` runs without the `server-only` package throwing — confirms `lib/resend.ts` is never reached from a client component (decision §5 / risk R4).
  - **Hex / font-family / copy-exclamation / emoji / voice greps** on `apps/web/src/components/about/`, `apps/web/src/components/contact/`, `apps/web/src/app/about/page.tsx`, `apps/web/src/app/contact/page.tsx`, `apps/web/src/app/contact/actions.ts`, `apps/web/src/lib/resend.ts`: all clean (SC-021). Em-dashes OK; question marks OK.
  - **Server/client boundary (SC-022)**: `grep -l "use client" apps/web/src/components/about apps/web/src/components/contact apps/web/src/app/about apps/web/src/app/contact apps/web/src/lib/resend.ts` returns **exactly one** file: `apps/web/src/components/contact/contact-form.tsx`. Both route entries are `async function` with no `"use client"`.
  - **Additive-only (SC-023)**: `git diff --stat origin/main..HEAD` shows no changes under `apps/web/src/components/landing/`, no changes to slice-006 pricing/FAQ files, no changes to `design/`, no changes to `packages/`. The only existing-on-main file modifications are the wholesale replacement of `apps/web/src/app/about/page.tsx` and the `apps/web/package.json` `+2 deps` + `pnpm-lock.yaml` regen.
  - **CTA target audit**: ContactPaths cards → `/faq`, `mailto:support@bristle.dev`, `mailto:sales@bristle.dev`; ContactPaths chevron is `ChevronRight` not unicode arrow; ContactFormError mailto = `mailto:support@bristle.dev`; submit button posts to the Server Action via `useActionState` (no manual `fetch`).
  - **Per-page metadata (SC-008)**: `/about` head has `<title>About — Bristle</title>`, meta description, og:title, og:description, og:url = `https://bristle.vercel.app/about`, og:image absolute slice-005 raster, **no `<meta robots>`**. Same checks for `/contact` with `Contact — Bristle` + `og:url = https://bristle.vercel.app/contact`.
  - **No regression on footer Help center**: footer renders `Help center → /faq` (no edit this slice; verify it still works by clicking from the landing page).
  - **No regression on slice-006 `/contact` references**: open `/pricing`, click "Contact sales →" → lands on `/contact` (was 404 in slice 007, is 200 now). Open `/faq`, click "Contact support →" and "Open a ticket →" → both land on `/contact`. These are now live links instead of out-of-scope-known-404s.
  - **Responsive sweep (FR / SC-007 equivalent)** at 320 / 375 / 768 / 1024 / 1280 / 1440 on both `/about` and `/contact`: no horizontal scroll, no overlap, no clipped text. `/contact` collapses to single column below `md` with paths-first then form per clarification (d).
  - **4px-tolerance visual diff (SC-001 / SC-002)** vs `design/Public_pages.pdf` p.2 + p.9 at **1280** (design viewport) AND **375** (mobile reflow) per decision §8. Per-section comparison; pull-quote accent bar, founder card avatar shape (non-rotated per clarification (g)), ContactPaths chevron-right placement, and the form field stack are the most-likely 4px-tolerance suspects (risk R1).
  - **Lighthouse on local prod build (SC-019)** for `/about` and `/contact`: Performance / Accessibility / Best-Practices each ≥ 90. SEO 100 on local-prod (Vercel preview will show SEO 60 due to `x-robots-tag: noindex` header — documented artifact, not a regression).
  - **Form submission walk in BOTH env-var states (SC-003 / SC-004)**:
    - **State A** (env vars unset; default local state — confirm `apps/web/.env.local` does NOT contain Resend vars): submit valid input → response renders `<ContactFormError/>` banner with the exact text from spec FR-015 ("Could not send right now…"); no HTTP 500; no client console error; form fields preserve the visitor's inputs (`state.values` echo-back working).
    - **State B** (env vars set in `apps/web/.env.local`: `RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT` = a test inbox you control, `CONTACT_FORM_FROM` = a Resend-verified sender): submit valid input → response renders `<ContactFormSuccess/>` ("Message sent." + body); confirm the actual email arrives at the test inbox within ~30 seconds; confirm `Reply-To` header is set to the visitor's submitted email; confirm subject is `Bristle contact: {topic-label} from {name}`; confirm body is plain-text with the four metadata lines + `--` separator + message.
  - **JS-disabled walk (SC-006)**: open `/contact` in a browser with JavaScript disabled (DevTools → Settings → Disable JavaScript, then reload). Submit the form with valid input. The browser POSTs to the Server Action as a native HTML form; the server-rendered response shows the same success state (state B) or error state (state A). Submit with invalid input (e.g. empty Name) → server-rendered validation-error state with the inline field error.
  - **Keyboard reach (SC-007)** on `/contact`: Tab order from top-nav → path cards → name → email → topic → message → submit → footer; focus rings visible at every step; topic `<select>` operable with arrow keys (native browser behavior); on validation-error → focus jumps to first invalid field per decision §7; on transport-error → focus jumps to error banner; on success → focus jumps to success heading.
  - **FR-012a-style PLACEHOLDER review surface check**: `head -1 apps/web/src/components/about/about-content.ts` returns the `[PLACEHOLDER — review before production launch]` comment; `head -1 apps/web/src/components/contact/contact-paths.ts` returns the `[PLACEHOLDER — review DNS/email setup before production launch]` comment. Both headers are intact and accurate post-implementation.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T022 · [US3] VERIFY — deploy preview parity (gate)
Push the branch via the gh-token HTTPS workaround; confirm the Vercel preview.
- **Depends on**: T021
- **Verify (SC-020)**:
  - Preview URL pattern: `https://bristle-git-008-about-and-contact-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api repos/cornel-stack/bristle/commits/<sha>/check-runs` after the Vercel build completes).
  - **Routes resolve**: `curl -sI <preview>/about` and `curl -sI <preview>/contact` both return HTTP 200.
  - **Meta tags resolve on preview**: `curl -s <preview>/about | grep -E 'og:(title|description|url|image|type)'` shows the full OG set with absolute `bristle.vercel.app` URLs (NOT preview host). Same for `/contact`.
  - **No body `<meta robots>`**: `curl -s <preview>/about <preview>/contact | grep -c 'meta[^>]*robots'` returns 0 (the `x-robots-tag: noindex` HTTP header is the Vercel preview default — same artifact as slices 005 / 006 / 007 — not a body meta).
  - **Visual diff vs PDF on preview**: identical to local within 4px per section at 1280 AND 375 widths.
  - **No client-side console errors** on either page in the browser console.
  - **Form on preview demonstrates graceful-degradation**: Vercel env vars for Resend are NOT set yet (the ship-state per plan §"Production launch checklist"); submit valid input → inline error banner renders; no HTTP 500; preview is operable.
  - **Regression check**: open `/pricing` and `/faq` on the preview; both still work (slice 006). Submit no actions (just visual check). Open the landing, scroll to footer, click "Help center" → lands on `/faq` (still works post-slice-006 footer flip).
  - **Slice-006 `/contact` references on preview**: `/pricing` Enterprise card "Contact sales →" → lands on `/contact` (200 now); `/faq` "Contact support →" + "Open a ticket →" → land on `/contact` (200 now). Were known out-of-scope-404s through slice 007.
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — About + Contact + Resend integration live locally and on the preview; slice complete.

---

## Dependencies & Execution Order

```
Batch A:
  T001 (deps)
    ├── T006 (contact-schema) ──┐
    └── T007 (lib/resend) ──────┤
  T002 [P] (env.example)        │
  T003 [P] (about-content)      │
  T004 [P] (contact-topics) ────┘  (T006 depends on T004 + T001)
  T005 [P] (contact-paths)
  T008 (VERIFY) ← T001..T007

Batch B:
  T009 (Server Action) ← T004 + T006 + T007
  T010 [P] (success component)
  T011 [P] (error component)
  T012 (ContactForm) ← T009 + T010 + T011 + T006 (type-only)

Batch C:
  T013 [P] (AboutHero) ← T003
  T014 [P] (AboutBody) ← T003
  T015 [P] (FounderCard) ← T003
  T016 [P] (NewsletterStub)
  T017 [P] (ContactHero)
  T018 (ContactPaths) ← T005
  T019 (/about/page.tsx) ← T013 + T014 + T015 + T016
  T020 (/contact/page.tsx) ← T012 + T017 + T018

Batch D:
  T021 (local gate) ← T019 + T020
  T022 (preview parity) ← T021
```

### Key dependency edges
- **T001 → T006, T007**: zod and resend deps must be installed before any module that imports them can compile.
- **T004 → T006**: `CONTACT_TOPIC_KEYS` is the source of truth for the zod `topic` enum.
- **T004 → T009**: `CONTACT_TOPIC_LABELS` is needed by the Server Action to translate the kebab-case topic key to the display label before passing to Resend (per plan §6).
- **T006 → T009**: the Server Action calls `contactFormSchema.safeParse(...)`.
- **T007 → T009**: the Server Action awaits `sendContactMessage(...)`.
- **T009 + T010 + T011 + T006 (type) → T012**: ContactForm needs the action, the success/error components, and the `ContactFormInput` type.
- **T013-T016 → T019**: `/about/page.tsx` composes all four About sections.
- **T012 + T017 + T018 → T020**: `/contact/page.tsx` composes the two non-form sections + the form.
- **T019 + T020 → T021**: local gate requires both routes implemented.
- **T021 → T022**: preview parity runs after local checks pass + the branch is pushed.

### Parallel opportunities
- **Batch A**: T002/T003/T004/T005 touch independent files → parallel. T001 (deps) is sequential (gates Batches A-end and B). T006 depends on T001+T004 → not [P]. T007 depends on T001 → not [P]. T008 is the verify gate.
- **Batch B**: T010/T011 are independent files → parallel. T009 is the Server Action (sequential after Batch A's T006 + T007 land). T012 is the ContactForm (sequential after T009/T010/T011 + the type from T006).
- **Batch C**: T013/T014/T015/T016/T017 are all independent files → parallel. T018 needs only T005 (Batch A done). T019 and T020 are the route assemblies — sequential after their respective sections land.

### Sequencing concerns
1. **T001's `pnpm install` is the hardest gate of the slice** — must run before T006, T007 can typecheck (zod / resend imports would fail otherwise). Recommend T001 first, then the [P] cohort (T002/T003/T004/T005), then T006/T007, then T008.
2. **`apps/web/.env.local`** for State B testing in T021 needs the founder to (a) verify the bristle.dev domain in Resend OR use a Resend-verified test sender, and (b) set up a real test recipient inbox. If neither is available, **State B is skipped** with a note in the verification report and the State A graceful-degradation check is the canary that the slice works in production once env vars land. Risk R8 captures this.
3. **Vercel env vars NOT being set in production** is the documented ship state (clarification (a)). T022 explicitly tests this case to confirm graceful degradation works through the full preview pipeline.
4. **No rebase noise expected** — branch is on top of clean main since the start of this slice (no stacking like 006 → 007).
5. **Visual + Lighthouse defer to the human reviewer** at T021 / T022 — same CLI-agent constraint as prior slices. Code-side proxies (typecheck/lint/build/greps/diff-stat/route-200 curl/meta-tag curl/`pnpm why` audit) are agent coverage; viewport sweep + Lighthouse + PDF visual diff + form-submission-with-real-Resend are reviewer coverage.

## Implementation strategy (4 stops)
1. **Stop 1 (Batch A)**: foundations — 2 new deps installed, env vars documented, 4 content data files in place, Resend wrapper exposed.
2. **Stop 2 (Batch B)**: Server Action live; ContactForm + success/error components typecheck in isolation.
3. **Stop 3 (Batch C)**: 4 About sections + 2 Contact sections + 2 route entries with metadata — both pages assembled.
4. **Stop 4 (Batch D)**: full quality/preview gate including form submission in both env-var states.

## Task count
22 tasks — **19 commit-producing** (T001-T007, T009-T012, T013-T020 + T002 dual-purpose [SETUP]+commit), **3 verification gates** (T008, T021, T022). Grouped into **4 batches / 4 stops**. Same size as slice 006 (22 tasks across 4 batches).

## Out of scope (no tasks)
- Legal-template pages (Terms / Privacy / Security / GDPR) — **slice 009**.
- Newsletter wiring (`apps/web/src/components/landing/site-footer.tsx` stub + the new About `NewsletterStub`) — **slice 2.7** (will likely converge both stubs into one shared component).
- Better Stack status integration — **slice 2.7**.
- Real `/api` documentation page — **Tier 5**.
- Honeypot / Cloudflare Turnstile / Vercel KV rate limiting — **post-launch follow-up** if spam volume warrants (clarification (c)).
- Any modifications to slice-005 top nav / site footer / OG image / design tokens / problem cards.
- Any modifications to slice-006 pricing/FAQ pages (their `/contact` references flip from 404 to 200 automatically when this slice ships — no edit to those files).
- Any modifications to `design/Public_pages.pdf` (read-only contract per §9.1).
- Any DB schema change, any new `@bristle/db` query helper (neither page reads from the DB).
- Vitest harness for the Server Action — **future infra slice** (risk R5).
- `/api/contact` JSON API route handler — out of scope this slice and possibly forever (Server Action is the canonical entry).
