# Feature Specification: About + Contact + Resend integration

**Feature Branch**: `008-about-and-contact`

**Created**: 2026-05-24

**Status**: Draft

**Input**: User description: "Slice 008 — part 1 of the originally enumerated 'Slice 2.3 About + Contact + Legal'. Covers the About page (`design/Public_pages.pdf` p.2), the Contact page (p.9), and the Resend integration that powers the contact form's Server Action. The legal-template pages (Terms / Privacy / Security / GDPR) defer to slice 009 — same split precedent as 006 → 007. Resend ships with graceful degradation so the form goes live the moment env vars land in Vercel."

## Overview

This slice adds the two remaining first-priority public pages to Tier 2 — About and Contact — and stands up the email infrastructure that powers the contact form. The About page is a left-aligned editorial article (eyebrow + serif display headline + byline + 5 body paragraphs + 1 pull-quote + founder card + inline newsletter stub) replacing the slice-005 soft-404 stub at `/about`. The Contact page is a two-column layout (paths on the left, "Send us a message" form on the right) at a brand-new route `/contact` that finally resolves the four out-of-scope-known-404 references shipped in slice 006 (Enterprise card's "Contact sales →", FAQ Still-Stuck card's "Contact support →", FAQ bottom CTA's "Open a ticket →"). The form is a Next.js 15 Server Action validated by zod, posted via React 19's `useActionState`, and progressively enhanced so it works with JS disabled. It sends through the newly-locked Resend integration; if any of the three required env vars (`RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, `CONTACT_FORM_FROM`) is missing at request time the form gracefully degrades to its visible error state ("Could not send right now. Email us directly at support@bristle.dev…") rather than throwing — so this slice can ship and merge before `bristle.dev` is DNS-verified in Resend, and the form starts working automatically the moment the founder lands the env vars in Vercel. Two new top-level dependencies (`resend` and `zod`) are added with the §9.5 propose-first gate. The slice ships **Editorial Light only** (next-themes still deferred to slice 2.6 per slice-006 plan §6 D-d). All About body copy and all addresses (`support@`, `sales@`, `hello@`, `contact@`) carry **`[PLACEHOLDER — review before production launch]`** markers in source so the founder can revise before the eventual Tier-2 v0.2.0 tag.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor reads the About page and learns what Bristle is and who's behind it (Priority: P1)

A visitor clicking About in the top nav or the footer lands on a real article instead of a soft-404 stub. They see the editorial hero (eyebrow + serif display headline + byline), read five paragraphs that tell the founder's frustration / category critique / what Bristle does / how the ML is positioned / one-person-company posture, see a pull-quote that crystallizes the thesis, meet the founder via a small card (avatar + name + bio), and land on an inline newsletter stub at the bottom that promises one report per month "Subscriptions open in v0.2.7." The page reads in Bristle's voice and matches the design contract within 4px tolerance.

**Why this priority**: This is the founder's voice — the page that converts a visitor's "what is this?" curiosity into trust. Before launch, About is one of the four pages every serious visitor checks (with Pricing, FAQ, and the landing). It is also the slice that replaces the most-clicked footer 404 stub from the launch surface.

**Independent Test**: Open `/about` on a production build; confirm the editorial article renders with the exact byline + 5 paragraphs + pull-quote + founder card + newsletter stub in order, matches the PDF p.2 within 4px per section, and contains no soft-404 stub markup.

**Acceptance Scenarios**:

1. **Given** `/about` on a production build, **When** it loads, **Then** the page renders, top to bottom: top nav (reused from slice 005), left-aligned hero (eyebrow "ABOUT BRISTLE", serif display headline "We build research tools for builders who hate guessing.", byline "PUBLISHED 2026-05-24 · By Cornel Okoth · 3 min read"), five body paragraphs in the documented order with the pull-quote ("Most product ideas die from being built before they were proven. The remedy is not more ideas — it is more evidence.") rendered as a `<blockquote>` between paragraphs 2 and 3, founder card (avatar + name "Cornel Okoth" + bio), inline newsletter stub (FIELD NOTES — MONTHLY eyebrow + serif heading + disabled email input + disabled Subscribe button + "Subscriptions open in v0.2.7." caption), site footer (reused from slice 005).
2. **Given** the article body, **When** inspected for semantics, **Then** the body is wrapped in `<article>` with paragraphs as `<p>` and the pull-quote as `<blockquote>`; the founder card uses a non-rotated filled accent square with "CO" initials in white text (not the rotated brand diamond).
3. **Given** any copy on the page, **When** reviewed, **Then** it follows the project voice — no exclamation marks, no emoji, no "amazing/awesome" register.
4. **Given** the soft-404 stub that previously lived at `/about`, **When** the build runs, **Then** the `ComingSoon` import and the `robots: { index: false, follow: false }` metadata are no longer present in `apps/web/src/app/about/page.tsx`.
5. **Given** the rendered page vs `design/Public_pages.pdf` p.2 at the design viewport, **When** compared, **Then** each section matches within 4px tolerance.

---

### User Story 2 - A visitor finds the right path to contact Bristle and (optionally) submits a message (Priority: P1)

A visitor clicking Contact from the top nav, the footer, slice-006's Enterprise card, slice-006's FAQ Still-Stuck card, or slice-006's FAQ bottom CTA lands on a real page that gives them three paths upfront (Help center, Email support, Enterprise sales) and a "Send us a message" form on the right. They can skim the path cards and pick the right channel, or fill out the form (name, email, topic dropdown, message), hit submit, and either see a success state ("Message sent.") if Resend is configured and accepts the send, or see a graceful error banner ("Could not send right now. Email us directly at support@bristle.dev…") if Resend isn't configured or fails. The page is fully keyboard-reachable, the form posts even with JS disabled, and validation errors render inline.

**Why this priority**: Until this slice ships, the four "/contact" references in slice-006 chrome 404 — which is a regression-feeling surface on a launched product. The slice flips them all from broken to working with one route. The form is the lowest-friction path for a visitor who doesn't know which email to use; the three path cards above the fold catch visitors who do.

**Independent Test**: Open `/contact` on a production build; confirm the seven elements (nav · hero · three path cards · form · footer) render and match PDF p.9 within 4px; confirm tab-order is name → email → topic → message → submit; submit with valid inputs and confirm either the success state (if env vars set) or the graceful error banner (if not) renders; submit with invalid inputs (empty fields, bad email, too-short or too-long message) and confirm inline field errors appear and the form does not submit.

**Acceptance Scenarios**:

1. **Given** `/contact` on a production build, **When** it loads, **Then** the page renders, top to bottom on desktop: top nav (reused), two-column body — left column (eyebrow "CONTACT", serif headline "Get in touch.", subhead "One inbox. Replies within a business day.", three path cards stacked: Help center → `/faq` / Email support → `mailto:support@bristle.dev` / Enterprise sales → `mailto:sales@bristle.dev`, each with a lucide icon left + label + subtitle + chevron-right indicator); right column (form card with name + email + topic select + message textarea + "Send message" button + "We respond within one business day." caption); site footer (reused).
2. **Given** the contact form in the default ship state (`RESEND_API_KEY` / `CONTACT_FORM_RECIPIENT` / `CONTACT_FORM_FROM` not set in the deploy environment), **When** the visitor submits valid input, **Then** the Server Action returns a not-configured response, the form renders the inline error banner "Could not send right now. Email us directly at support@bristle.dev and we'll respond from there.", and the visitor's inputs are preserved in the form fields (no data loss). No HTTP 500. No throw. No client console error.
3. **Given** the contact form when the three env vars ARE set in the deploy environment, **When** the visitor submits valid input, **Then** the Server Action successfully sends a single email via Resend with the four form fields in the body and the visitor's email address as the `Reply-To` header, and the form renders the success state ("Message sent." heading + "We'll be in touch within one business day. — Cornel" body).
4. **Given** the contact form, **When** the visitor submits with any combination of: empty Name / empty Email / invalid email format / unselected Topic / Message under 10 chars or over 2000 chars, **Then** the Server Action does NOT call Resend, and the form re-renders with inline field-level error messages associated with each invalid field via `aria-describedby`, no email is sent.
5. **Given** the contact form with JavaScript disabled in the browser, **When** the visitor submits the form, **Then** the form posts to the Server Action endpoint as a native HTML form, the server-rendered response renders the same success / error / validation states as the JS-enhanced flow (progressive enhancement).
6. **Given** keyboard-only navigation, **When** the visitor tabs through `/contact`, **Then** the tab order is: top nav links → path cards (each is a focusable link) → name → email → topic select → message → submit → footer links; the focus ring is visible on every step; the topic select is operable with arrow keys per native `<select>` behavior.
7. **Given** the four slice-006 components that reference `/contact` (Enterprise card "Contact sales →", FAQ Still-Stuck card "Contact support →", FAQ bottom CTA "Open a ticket →", and any other reference in the shipped chrome), **When** a visitor clicks any of them, **Then** the visitor lands on the new `/contact` page (HTTP 200) instead of the documented out-of-scope-known-404 they hit before this slice shipped.
8. **Given** the rendered page vs `design/Public_pages.pdf` p.9 at the design viewport, **When** compared, **Then** each section matches within 4px tolerance.

---

### User Story 3 - Both pages meet the perf, a11y, SEO, and voice floors (Priority: P1)

`/about` and `/contact` each load quickly on mobile, are keyboard- and screen-reader-usable end-to-end (including the new form), are correctly described to search engines and social-share cards, and reflow cleanly across the six target widths. The Contact form is fully form-accessible: labeled fields, `type="email"` on the email input, `required` attributes set, validation errors associated with their fields, focus rings visible.

**Why this priority**: Same posture as slice 005 (US2) and slice 006 (US3) — the public surface's perceived credibility is non-negotiable for a skeptical technical audience. Adding a form raises the a11y bar specifically: a broken form is a worse user experience than no form, and the form is the slice's most-visible new piece of interactive UI.

**Independent Test**: Run Lighthouse against `/about` and `/contact` on a production build and confirm all four category scores meet the floor on each; measure the initial script payload for each route; resize across the six target widths and confirm clean reflow; inspect the emitted metadata and Open Graph tags on each page; walk the form with keyboard + screen reader and confirm every interactive surface is reachable and described.

**Acceptance Scenarios**:

1. **Given** a production build of `/about` and `/contact`, **When** each is audited, **Then** Performance, Accessibility, Best Practices, and SEO each score at least 90.
2. **Given** each route, **When** its initial script payload is measured, **Then** it is under 180 KB compressed.
3. **Given** widths of 320, 375, 768, 1024, 1280, and 1440, **When** each page is viewed at each, **Then** there is no horizontal scroll, no overlapping content, and no clipped text; the Contact page's two-column layout collapses vertically below `md` with the path cards rendered first, then the form (matches natural top-to-bottom reading; clarification (d)).
4. **Given** each page head, **When** inspected, **Then** it emits a page-level title (`About — Bristle`, `Contact — Bristle`), meta description, og:title, og:description, og:url (absolute, consuming `SITE_URL`), and og:image (absolute, reusing the slice-005 raster); neither sets `robots: noindex`.
5. **Given** the Contact form, **When** exercised with keyboard alone, **Then** every control is reachable, focus is visible at every step, name + email + message inputs have programmatic `<label>` associations, the email input is `type="email"` with `required`, the topic `<select>` is `required` with a placeholder option, and field-level error messages render with `aria-describedby` pointing to the field they qualify.

---

### Edge Cases

- **Resend env vars present but Resend API rejects the send** (e.g. unverified `from` domain, rate-limit, transient 5xx): the Server Action surfaces the same inline error banner the not-configured state shows — the visitor sees one error UI for "the send did not succeed" regardless of root cause; the server logs the actual Resend error for the founder to diagnose post-hoc. No 500 to the browser.
- **Form re-submit after success**: the success state replaces the form (the form fields aren't re-rendered alongside the success copy); a re-submit requires a page reload — by design, the success state is terminal for the visitor.
- **Form re-submit after error**: the form re-renders with the visitor's prior inputs intact (no data loss) plus the inline error banner above the form fields; resubmitting attempts the send again.
- **Submitting from a slow connection while the action is in flight**: the submit button is disabled and shows a "Sending…" state via `useActionState`'s pending flag; double-clicking the button does not double-submit (Server Action ignores duplicate concurrent submissions for the same form instance).
- **Visitor with JavaScript disabled**: the form is a native `<form action={actionRef}>` so the browser posts the form fields directly; the Server Action runs and the response is server-rendered identically — no degradation in the success / error / validation paths.
- **Visitor with `prefers-reduced-motion`**: the only motion on these pages is the form's pending-state styling (a subtle color shift on the submit button); under reduced-motion this becomes a no-op or an opacity-only swap per the slice-005 motion policy.
- **`/about` visited at 320 width**: the article reflows to a single column (it already is on desktop); the founder card and newsletter stub stack vertically below the body; the pull-quote retains its accent bar but tightens its margins to fit.
- **`/contact` visited at 320 width**: the two-column body collapses to a single column with the path cards first, then the form (clarification (d)). The form fields stack vertically; the submit button + caption stack rather than sit side-by-side.
- **Path card to a known 404** (`/faq` is real after slice 006, but `mailto:` is the visitor's email client — no Bristle code involved): clicks resolve as expected; no Bristle 404 surface within this slice's responsibility.
- **Submitting an email address with surrounding whitespace or different casing**: zod's `.email()` normalizes via standard RFC-5321 parsing; trims are applied via `.trim()` on the schema (server-side); the visitor sees their cleaned email echoed back to them in the success state context.
- **Topic option default**: the select renders with a disabled placeholder `<option>` ("Pick one…" or similar) and no auto-selected real option — visitor must consciously pick.
- **About page byline date drift**: the byline string is fixed in `about-content.ts` (per clarification (f)) — the date does NOT auto-update on each deploy. Founder updates manually if/when the About is re-edited.

## Requirements *(mandatory)*

### Functional Requirements

**About page (US1)**

- **FR-001**: The route at `/about` MUST be replaced wholesale; the slice-005 soft-404 `ComingSoon` stub and its `robots: noindex` metadata MUST NOT remain. The page MUST render six elements in order — top nav (reused from slice 005), AboutHero, AboutBody (5 paragraphs + 1 pull-quote in the documented order), FounderCard, NewsletterStub, site footer (reused from slice 005) — matching `design/Public_pages.pdf` p.2 within a 4px tolerance per section.
- **FR-002**: The **About hero** MUST contain the eyebrow "ABOUT BRISTLE" (small-caps accent or secondary-text register per the PDF), the serif display headline "We build research tools for builders who hate guessing.", and the byline "PUBLISHED 2026-05-24 · By Cornel Okoth · 3 min read" rendered as a single dot-separated line beneath the headline. The date string is fixed (see Assumptions §"About byline date").
- **FR-003**: The **About body** MUST render an `<article>` containing the five paragraphs (verbatim per the user brief — see Key Entities) as `<p>` elements, with the pull-quote rendered as a `<blockquote>` between paragraphs 2 and 3, styled with a left accent bar and italic serif type. Paragraph order and pull-quote position MUST match the design.
- **FR-004**: The **FounderCard** MUST render a non-rotated filled `accent/bristle` square avatar with the initials "CO" in `surface/card` (white) text, followed by the name "Cornel Okoth" and the bio "Founder. Previously: software engineering across a few stacks; built and shipped consumer apps no one used so you don't have to." The avatar shape is a regular square, **not** the slice-005 brand diamond (rotated square) — see clarification (g).
- **FR-005**: The **NewsletterStub** MUST be a separate component (`apps/web/src/components/about/newsletter-stub.tsx`), not a reuse of the slice-005 footer newsletter stub. It MUST render: eyebrow "FIELD NOTES — MONTHLY", serif heading "Get one new problem report each month.", a **disabled** email input with placeholder `you@domain.com`, a **disabled** "Subscribe" button, and a small caption "Subscriptions open in v0.2.7." The stub MUST NOT have a submit handler.
- **FR-006**: All About paragraphs and the pull-quote MUST live in `apps/web/src/components/about/about-content.ts` as exported typed constants. The file MUST begin with a single header comment marking the content as `[PLACEHOLDER — review before production launch]` (lighter version of slice 006's FR-012a discipline: no per-paragraph sign-off bullets, just a "placeholder copy" flag so the founder can revise before the Tier-2 v0.2.0 tag). Voice rules (§6: no exclamation marks, no emoji, no "amazing/awesome") apply.

**Contact page (US2)**

- **FR-007**: A new route at `/contact` MUST be added (no prior placeholder — this is a brand-new route). The page MUST render five elements in order on desktop — top nav (reused), two-column body (left: ContactHero + ContactPaths; right: ContactForm), site footer (reused) — matching `design/Public_pages.pdf` p.9 within a 4px tolerance per section. Below `md` the layout collapses to a single column with the path cards first, then the form (clarification (d)).
- **FR-008**: The **ContactHero** MUST contain the eyebrow "CONTACT", the serif headline "Get in touch.", and the subhead "One inbox. Replies within a business day."
- **FR-009**: The **ContactPaths** MUST be three cards in a vertical stack. Each card has: a lucide icon on the left (1.5px stroke per §3), a label and subtitle in the middle, a chevron-right indicator on the right. The three cards, in order:
  - **Help center** — icon `LifeBuoy`, subtitle "Read documentation and how-tos.", href `/faq`
  - **Email support** — icon `Mail`, subtitle "support@bristle.dev · for paying customers.", href `mailto:support@bristle.dev`
  - **Enterprise sales** — icon `Zap`, subtitle "sales@bristle.dev · custom invoicing, SSO, on-prem ingestion.", href `mailto:sales@bristle.dev`
- **FR-010**: The **ContactForm** MUST be the only client component in the slice (per the boundary in FR-024). It MUST render four labeled form fields:
  - **Name** — `<input type="text">`, required, max 100 characters
  - **Email** — `<input type="email">`, required, RFC-valid format
  - **Topic** — `<select>`, required, four options: "Product question", "Bug report", "Enterprise inquiry", "Press or other" — with a disabled placeholder option as the default (visitor must consciously pick a real option)
  - **Message** — `<textarea>`, required, minimum 10 characters, maximum 2000 characters
  Plus a "Send message" submit button and a "We respond within one business day." caption beside the button.
- **FR-011**: The ContactForm MUST be implemented as a Next.js 15 Server Action defined in `apps/web/src/app/contact/actions.ts`, posted via React 19's `useActionState`. The form's `action` attribute MUST point at the Server Action so the browser can post natively when JavaScript is disabled (progressive enhancement; see edge case + AC-5).
- **FR-012**: All form input MUST be validated server-side via a shared zod schema at `apps/web/src/components/contact/contact-schema.ts`. Validation failures MUST re-render the form with inline field-level errors associated to their fields via `aria-describedby`. No email is sent when validation fails.
- **FR-013**: The Resend integration MUST live at `apps/web/src/lib/resend.ts` and export a single helper `sendContactMessage({ name, email, topic, message }): Promise<{ ok: true } | { ok: false; reason: "not-configured" | "send-failed" }>`. The helper MUST read `RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, and `CONTACT_FORM_FROM` from `process.env` **at request time**. When any of the three is missing or empty, the helper MUST return `{ ok: false, reason: "not-configured" }` WITHOUT calling Resend. When all three are present, the helper MUST call Resend; on any Resend error it MUST return `{ ok: false, reason: "send-failed" }` (and log the underlying error server-side). On success it MUST return `{ ok: true }`.
- **FR-014**: When the email is sent successfully, the Resend payload MUST set the `to` field to `CONTACT_FORM_RECIPIENT`, the `from` field to `CONTACT_FORM_FROM`, the `reply_to` field to the visitor's submitted email address, the `subject` to a string that includes the chosen topic (e.g. `[Bristle Contact] {topic} from {name}`), and the body to a plain-text rendering of the four form fields with clear labels.
- **FR-015**: The ContactForm's UI states MUST be: **idle** (the form), **submitting** (submit button disabled + "Sending…" label, fields read-only), **success** (ContactFormSuccess renders in place of the form: "Message sent." heading + "We'll be in touch within one business day. — Cornel" body), **error** (the form re-renders with the inline ContactFormError banner above the form fields: "Could not send right now. Email us directly at support@bristle.dev and we'll respond from there.", plus the visitor's prior inputs preserved). The not-configured case (FR-013 returns `reason: "not-configured"`) and the send-failed case both surface the **same** error banner — the visitor doesn't need to distinguish.
- **FR-016**: All addresses referenced in `apps/web/src/components/contact/contact-paths.ts` and in the error banner (`support@bristle.dev`, `sales@bristle.dev`, plus the implicit `hello@bristle.dev` / `contact@bristle.dev` env-var defaults documented in `.env.example`) MUST be flagged with a `[PLACEHOLDER — review DNS/email setup before production launch]` comment in the source file headers. The founder reviews these before the Tier-2 v0.2.0 tag.

**Resend dependency + env documentation (US2)**

- **FR-017**: `apps/web/package.json` MUST add `resend` (latest stable) and `zod` (latest stable, version-aligned with any existing workspace usage) to its `dependencies`. Per §9.5 the additions are documented in the plan's Constitution Check as proposed-and-accepted (Resend is named in §3 as the locked email provider; zod is not explicitly listed in §3 but is consistent with §5's "All forms validated with Zod schemas shared between server and client" rule).
- **FR-018**: `apps/web/.env.example` MUST exist (create if not present) and document all three required Resend env vars with explanatory comments:
  - `RESEND_API_KEY` (required for live form; not set = graceful degradation)
  - `CONTACT_FORM_RECIPIENT` (default `hello@bristle.dev`)
  - `CONTACT_FORM_FROM` (default `Bristle Contact <contact@bristle.dev>`)

**Cross-cutting (US3)**

- **FR-019**: Each new page MUST emit a page-level `<title>` and `<meta name="description">`, plus `og:title`, `og:description`, `og:url` (absolute, consuming `SITE_URL`), and `og:image` (absolute, reusing the slice-005 raster at `${SITE_URL}/og-image.png`). **Neither page** sets `robots: noindex`. Title strings: `About — Bristle` and `Contact — Bristle`. Description strings: "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes." (About); "Email, enterprise sales, or send us a message. One inbox, one business day." (Contact).
- **FR-020**: All tokens (color, type, spacing, radii, motion) in every new file MUST resolve through the design tokens. Every new file MUST contain zero hardcoded hex color literals and zero hardcoded font-family strings. Functional icons (the three path-card icons and the chevron indicator) MUST use the project's locked icon set (`lucide-react`) at 1.5px stroke.
- **FR-021**: All visible copy on both pages MUST follow the voice rules — no exclamation marks, no emoji, no "amazing/awesome" register. (The pull-quote's em-dash and the "—" in the byline / topic options are fine; em-dashes are punctuation, not exclamations.)
- **FR-022**: Both pages MUST render correctly in Editorial Light with no document-root theme marker set. next-themes integration is still deferred to slice 2.6 per slice-006 plan §6 D-d.
- **FR-023**: The `/about` route MUST be statically prerendered (○ Static in the build output) — no `force-dynamic`, no DB reads. The `/contact` route MAY be ○ Static (SSR renders the form markup; the Server Action endpoint is dynamic by definition) or ƒ Dynamic — either is acceptable; the plan's quickstart documents the actual choice from the build output.
- **FR-024**: Server vs Client boundary — `apps/web/src/app/about/page.tsx` and `apps/web/src/app/contact/page.tsx` MUST be async Server Components. **Only** `apps/web/src/components/contact/contact-form.tsx` MUST carry the `"use client"` directive (it uses `useActionState`). Every other new file — AboutHero, AboutBody, FounderCard, NewsletterStub, ContactHero, ContactPaths, ContactFormSuccess, ContactFormError, the Server Action in `actions.ts`, and the Resend helper in `lib/resend.ts` — MUST be a Server Component or server-only module. Verifiable by `grep -l "use client" apps/web/src/components/about apps/web/src/components/contact apps/web/src/app/about apps/web/src/app/contact` returning exactly one path.
- **FR-025**: This slice is **additive** to the slice-005 top nav, the slice-005 site footer (no change this slice — including no "About" / "Contact" link additions to the footer; the existing footer Company column already links to `/about` and `/contact`, see Assumptions), the OG image, the design tokens, the canonical and compact problem cards, and the slice-006 pricing/FAQ pages. No existing file outside the new spec dir, new env example, and the new module files is modified by this slice. (The slice does NOT modify the `apps/web/src/components/landing/site-footer.tsx` file from slices 005–007; the existing Company-column `/about` link and Company-column `/contact` link continue to work.)
- **FR-026**: Type-check, lint, and a production build of the web app MUST all succeed with no errors. `pnpm-lock.yaml` MUST update to reflect the two new top-level dependencies and their transitive tree.
- **FR-027**: This slice does NOT add any bot-spam protection (honeypot, Cloudflare Turnstile, Vercel KV-backed rate limiting, or equivalent). The only protection on submissions is the server-side zod validation (rejects malformed input). If spam volume becomes a problem post-launch, a follow-up patch slice adds protection. (Clarification (c) explicitly defers.)

### Key Entities *(include if feature involves data)*

This slice introduces **no database schema changes** and **no new query helpers**. All content is statically authored in the codebase. The following are content-shape entities — what each module exports — not persisted records:

- **AboutContent** (`apps/web/src/components/about/about-content.ts`):
  - `byline: { publishedDate: string; author: string; readTime: string }` (one instance — the byline data shown beneath the hero)
  - `paragraphs: readonly string[]` (five entries — the body paragraphs in display order; verbatim per the user brief)
  - `pullQuote: string` (one — rendered as `<blockquote>` between paragraphs 2 and 3)
  - `pullQuoteInsertAfterParagraph: number` (the index 1, zero-based, that controls where the pull-quote renders within the paragraph list)
  - `founder: { initials: string; name: string; bio: string }` (one — the founder card data)
  - The file's header comment carries the `[PLACEHOLDER — review before production launch]` marker.

- **ContactPath** (`apps/web/src/components/contact/contact-paths.ts`):
  - `{ label: string; subtitle: string; iconName: "LifeBuoy" | "Mail" | "Zap"; href: string }` (three instances per FR-009)
  - The file's header comment flags the three addresses (`support@bristle.dev`, `sales@bristle.dev`, plus the implicit defaults) as `[PLACEHOLDER — review DNS/email setup before production launch]`.

- **ContactTopic** (`apps/web/src/components/contact/contact-topics.ts`):
  - `type ContactTopic = "product-question" | "bug-report" | "enterprise-inquiry" | "press-or-other"`
  - `CONTACT_TOPIC_LABELS: Record<ContactTopic, string>` mapping each enum value to its display label ("Product question" / "Bug report" / "Enterprise inquiry" / "Press or other")
  - `CONTACT_TOPICS: readonly ContactTopic[]` for stable iteration order in the `<select>`.

- **ContactSchema** (`apps/web/src/components/contact/contact-schema.ts`):
  - A zod schema (exported as `contactSchema`) with: `name: z.string().trim().min(1).max(100)`, `email: z.string().trim().email()`, `topic: z.enum(CONTACT_TOPICS)`, `message: z.string().trim().min(10).max(2000)`. Shared between the Server Action (server-side validation) and the ContactForm's client-side preview validation (if any — server validation is the authority).

- **ContactFormState** (returned by the Server Action; consumed by `useActionState` in `contact-form.tsx`):
  - `{ status: "idle" } | { status: "success" } | { status: "error"; reason: "not-configured" | "send-failed"; values: { ...echo-back } } | { status: "validation-error"; fieldErrors: Record<string, string>; values: { ...echo-back } }`

- **ResendEnvelope** (server-only, never exposed to client):
  - `{ to: string; from: string; replyTo: string; subject: string; text: string }` — what the Resend helper passes to the Resend SDK when env vars are present.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a local production build, `/about` renders the full About page; a 4px-tolerance visual comparison against `design/Public_pages.pdf` p.2 passes for hero, byline, 5 body paragraphs, pull-quote, founder card, newsletter stub, and footer. *(AC US1-1, US1-5)*
- **SC-002**: On a local production build, `/contact` renders the full Contact page; a 4px-tolerance visual comparison against `design/Public_pages.pdf` p.9 passes for hero, three path cards, form with all four fields, and footer. *(AC US2-1, US2-8)*
- **SC-003**: The Contact form, in default ship state (env vars not set), displays the inline error banner on submit ("Could not send right now…") without throwing or 500'ing. Visitor inputs are preserved in the form fields. No client console error. *(AC US2-2)*
- **SC-004**: The Contact form, when all three env vars are set, successfully sends an email via Resend with the four form fields in the body and the visitor's email as the `Reply-To` header. Success state renders "Message sent." + the goodbye copy. *(AC US2-3)*
- **SC-005**: The Contact form validates server-side: empty Name / empty Email / invalid email format / unselected Topic / Message < 10 chars or > 2000 chars all produce inline field-level errors and prevent submission. No email is sent. *(AC US2-4)*
- **SC-006**: With JavaScript disabled, the Contact form's native HTML submit posts to the Server Action and the server-rendered response renders the same success / error / validation states as the JS-enhanced flow. *(AC US2-5)*
- **SC-007**: The Contact form is fully keyboard-reachable: tab order is name → email → topic → message → submit; focus rings visible at every step; topic `<select>` operable with arrow keys per native behavior. *(AC US2-6)*
- **SC-008**: `/about` and `/contact` each emit a page-level title (`About — Bristle`, `Contact — Bristle`), meta description, `og:title`, `og:description`, `og:url` (absolute from `SITE_URL`), and `og:image` (absolute, slice-005 raster). Neither sets `robots: noindex`. *(AC US3-4)*
- **SC-009**: `/about` no longer renders the `ComingSoon` stub; `/contact` responds HTTP 200 (was 404). The four slice-005 soft-404 stubs that did not change this slice (`/blog`, `/changelog`, `/login`, `/signup`) continue to render their stubs with `robots: noindex` — no regression. The four legal pages that do not exist yet (`/terms`, `/privacy`, `/security`, `/gdpr`) continue to 404 — known out-of-scope until slice 009.
- **SC-010**: The build output marks `/about` as ○ Static. `/contact` is marked ○ Static OR ƒ Dynamic — either is acceptable per FR-023; the choice is documented in `quickstart.md`.
- **SC-011**: `apps/web/package.json` includes `resend` and `zod` in `dependencies`. `pnpm-lock.yaml` updates to reflect the dependency tree.
- **SC-012**: `apps/web/.env.example` exists and documents all three Resend env vars (`RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, `CONTACT_FORM_FROM`) with explanatory comments for each.
- **SC-013**: `apps/web/src/lib/resend.ts` exists; `sendContactMessage` is exported with the documented `Promise<{ ok: true } | { ok: false; reason }>` return shape; runtime env-var-presence check returns `{ ok: false, reason: "not-configured" }` when any of the three vars is missing or empty.
- **SC-014**: `apps/web/src/components/about/about-content.ts` exists with the 5 paragraphs + pull-quote + founder data + byline data per the user brief, and a header comment marking the content as `[PLACEHOLDER — review before production launch]`.
- **SC-015**: `apps/web/src/components/contact/contact-paths.ts`, `contact-topics.ts`, and `contact-schema.ts` all exist with the documented shapes; the addresses in `contact-paths.ts` are flagged with the placeholder comment per FR-016.
- **SC-016**: `pnpm typecheck`, `pnpm lint`, and `pnpm --filter web build` each exit 0.
- **SC-017**: First Load JS for `/about` is under 180 KB compressed.
- **SC-018**: First Load JS for `/contact` is under 180 KB compressed.
- **SC-019**: A production-build audit of `/about` and of `/contact` each scores at least 90 for Performance, Accessibility, Best Practices, and SEO (SEO 60 on the Vercel preview hostname is the documented `x-robots-tag` artifact from slices 005 / 006 / 007 and not a regression; local-prod SEO MUST be 100).
- **SC-020**: The deployed Vercel preview renders both pages identically to local within 4px tolerance and produces no browser-console errors. The contact form on the preview demonstrates the graceful-degradation path (env vars not set yet → inline error banner on submit, no 500).
- **SC-021**: Greps across `apps/web/src/components/about/`, `apps/web/src/components/contact/`, the two route `page.tsx` files, the Server Action at `apps/web/src/app/contact/actions.ts`, and `apps/web/src/lib/resend.ts`: zero hardcoded hex color literals, zero hardcoded font-family strings, zero exclamation marks in user-visible copy, zero emoji, zero "amazing/awesome" register.
- **SC-022**: Server/Client boundary: `grep -l "use client" apps/web/src/components/about/ apps/web/src/components/contact/ apps/web/src/app/about/page.tsx apps/web/src/app/contact/page.tsx apps/web/src/app/contact/actions.ts apps/web/src/lib/resend.ts` returns **exactly one** file: `apps/web/src/components/contact/contact-form.tsx`. The two route entries are async Server Components (no `"use client"`, `export default async function`).
- **SC-023**: Additive-only: `git diff --stat origin/main..HEAD` shows no changes under `apps/web/src/components/landing/`, no changes to `packages/` (other than possibly `pnpm-lock.yaml` aggregation if pnpm restructures), no changes to `design/`, no changes to existing slice-006 pricing/FAQ files. The only modifications to existing-on-main files are the wholesale replacement of `apps/web/src/app/about/page.tsx` and the creation (not modification) of `apps/web/package.json`'s `dependencies` block (adding two entries).

## Assumptions

- **Slice numbering**: this is slice **008**, part 1 of the originally-enumerated build-plan slice "2.3 About + Contact + Legal". The legal-template pages (Terms / Privacy / Security / GDPR) defer to slice **009** as a separate cohesive cycle (same precedent as slice 007 splitting off from slice 006). The Tier 2.X canonical sequence in `docs/Bristle-Build-Plan.pdf` is unchanged; slice 008+009 together complete what the plan enumerates as 2.3.
- **Branch stacking**: `008-about-and-contact` was cut from `origin/main` (post-007 merge, commit `e9e75a4`); the branch is on top of clean main from the start of this slice. No stacking on an unmerged predecessor (unlike 006 → 007).
- **Founder confirmation on content**: all About body copy + all founder-card data + all `@bristle.dev` addresses ship as `[PLACEHOLDER]` per FR-006 / FR-016. The founder reviews and edits before the Tier-2 v0.2.0 tag (which ships only after slices 2.1–2.7 land). Treat the verbatim content in the user brief as the launch-ready starting point, not the final word — review pre-launch is the contract.
- **About byline date (resolved per clarification (f))**: fixed string in `about-content.ts` (`PUBLISHED 2026-05-24`). Does NOT auto-update on each deploy. Founder updates manually if/when the About is re-edited. Rationale: an article byline that drifts with each deploy reads as suspicious to a careful reader.
- **Founder card avatar shape (resolved per clarification (g))**: regular (non-rotated) `accent/bristle` filled square, white "CO" initials, sized roughly `size-12` (48px). NOT the rotated brand diamond from `top-nav.tsx` / `site-footer.tsx` (which is `size-3 rotate-45`). Rationale: PDF p.2 shows a plain orange square avatar, not the brand-diamond rotation.
- **Newsletter stub on About (resolved per clarification (e))**: separate component (`apps/web/src/components/about/newsletter-stub.tsx`), NOT a reuse of the footer's inline stub. Rationale: PDF styling differs (full-card with `surface/raised` background vs. footer's inline-row treatment); slice 2.7 may wire the two differently when newsletter goes live.
- **Resend graceful degradation (resolved per clarification (a))**: runtime env-var-presence check inside `sendContactMessage` returning `{ ok: false, reason: "not-configured" }` (NOT thrown error, NOT build-time feature flag). Rationale: the form already has a documented error state; surfacing both not-configured and send-failed through the same UI keeps the visitor's experience predictable, and the runtime check lets the slice ship before bristle.dev is DNS-verified in Resend.
- **Server Action vs API route (resolved per clarification (b))**: Next.js 15 Server Action via React 19's `useActionState` (NOT an `/api/contact` route handler + manual `fetch`). Rationale: progressive enhancement is free (the form posts natively with JS disabled), state management is `useActionState` (zero boilerplate), no separate API surface to secure / version.
- **Spam protection deferred (resolved per clarification (c))**: NO honeypot, NO Cloudflare Turnstile, NO Vercel KV rate limiting in slice 008. The form is publicly submittable; server-side zod validation is the only protection. Rationale: the form sends to the founder's inbox only, spam volume at launch is human-manageable. If spam becomes a problem post-launch, a follow-up patch slice (slice 010 or later) adds Turnstile (free tier) or KV-backed one-per-IP-per-60s rate limiting.
- **Mobile layout for Contact (resolved per clarification (d))**: below `md`, the two-column body collapses to a single column rendered as **paths first, then form** (natural top-to-bottom reading; the form is the primary action that comes after the visitor has decided which channel is right for them). The alternative — form-then-paths — was rejected because it forces a visitor who actually wants the email link to scroll past the form to find it.
- **New top-level dependencies**: `resend` (named in CLAUDE.md §3 as the locked email provider — addition is a §9.5 propose-and-accept formality) and `zod` (not explicitly listed in §3 but consistent with §5's "All forms validated with Zod schemas shared between server and client" rule — same propose-and-accept formality). Both documented in the plan's Constitution Check.
- **Environment variables**: three new env vars (`RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT`, `CONTACT_FORM_FROM`) added to Vercel project settings by the founder out-of-band before the form goes live. The slice ships with graceful degradation if any are missing — the form's error banner is the canary that surfaces "env vars not set yet". A `.env.example` ships in the repo to document the contract.
- **No `next/image` use this slice**: the founder avatar is a CSS-styled `<div>` with text initials (no raster). The OG image is metadata-only (reused from slice 005). The path-card icons are inline SVG via `lucide-react`. No on-page rasters; no `next/image` import needed.
- **No request-time data reads**: both pages are content-static — no DB fetches, no API calls during render. The Server Action at `/contact/actions.ts` is dynamic by definition (it runs per-submission); the page that hosts it is statically prerendered.
- **Existing footer columns** already link to `/about` (Company column) and `/contact` (Company column) per slice 005's `site-footer.tsx`. Both links become live the moment this slice ships, with no edit to `site-footer.tsx` required. (Slice 006 set the precedent for href-value edits to slice-005 footer files; this slice doesn't need that precedent — the hrefs are already correct.)
- **No tag** is created by this slice. Per the project's release-tagging discipline, `v0.2.0` ships only when all of Tier 2 (slices 2.1–2.7) is on `main`. Slice 008 is part-of-2.3; the wait continues.
- **PDF↔code drift carry-over**: the pricing PDF drift carve-out introduced in slice 007 (tier prices) does NOT extend to slice 008. The About and Contact PDFs (`Public_pages.pdf` p.2 + p.9) are read-only contract for this slice's visual-diff gate; the 4px tolerance applies to everything on those pages.

## Clarifications

All seven open questions surfaced before `/speckit.plan` were resolved by the user's slice-008 brief on 2026-05-24 and folded into the requirements / assumptions above:

- **(a) Resend graceful degradation pattern → runtime env-var check returning structured result** (FR-013, FR-015; SC-003, SC-013). Rejected the alternative build-time feature-flag-stub-swap.
- **(b) Server Action vs API route → Next.js 15 Server Action via React 19 `useActionState`** (FR-011, FR-015; SC-006). Rejected `/api/contact` route handler + manual `fetch`.
- **(c) Form spam protection → deferred to a future patch slice** if spam becomes a problem post-launch (FR-027). Slice 008 ships with server-side zod validation as the only protection. Cloudflare Turnstile / Vercel KV rate limiting are the two leading candidates if the follow-up is needed.
- **(d) Mobile layout for Contact → paths first, then form** below `md` (AC US3-3; edge case). Rejected the form-then-paths alternative.
- **(e) NewsletterStub on About → separate component**, not a reuse of the footer's inline stub (FR-005). Rationale: PDF styling differs and 2.7 may wire them differently.
- **(f) About page byline date → fixed string in `about-content.ts`** (`PUBLISHED 2026-05-24`); does NOT auto-update on each deploy (FR-002, Assumptions §"About byline date").
- **(g) Founder card avatar shape → non-rotated `accent/bristle` filled square** with white "CO" initials, NOT the brand diamond (FR-004, Assumptions §"Founder card avatar shape"). Rationale: PDF shows a plain square, not the slice-005 brand rotation.

### Planning readiness

All clarifications resolved; no outstanding decisions. The spec is ready for `/speckit.plan`. The plan should pin the four-batch implementation shape used in slices 005 / 006 (this slice has both new pages + new dependencies + new infrastructure module + new form + new env contract — single-batch would be too compressed for the reviewable-diff-per-stop discipline), with the suggested grouping:

- **Batch A** — foundations: `resend` + `zod` deps, `.env.example`, content data files (`about-content.ts`, `contact-paths.ts`, `contact-topics.ts`, `contact-schema.ts`), the Resend helper (`lib/resend.ts`).
- **Batch B** — About-page sections: `AboutHero`, `AboutBody`, `FounderCard`, `NewsletterStub`.
- **Batch C** — Contact-page sections + Server Action: `ContactHero`, `ContactPaths`, `ContactForm` (the only client component), `ContactFormSuccess`, `ContactFormError`, the Server Action in `actions.ts`.
- **Batch D** — page composition + gates: `/about/page.tsx`, `/contact/page.tsx` with metadata, local gate, preview parity gate.
