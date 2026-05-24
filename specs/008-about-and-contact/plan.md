# Implementation Plan: About + Contact + Resend integration

**Branch**: `008-about-and-contact` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-about-and-contact/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Replace the slice-005 soft-404 `/about` stub with the full editorial About page (`design/Public_pages.pdf` p.2) and add the brand-new `/contact` route (p.9). Both pages reuse the slice-005 `TopNav` and `SiteFooter` unchanged (footer's Company column already references `/about` and `/contact` — both light up automatically when this slice ships; confirmed via grep at plan time). The Contact page introduces this slice's only interactive surface — `ContactForm`, a `useActionState`-driven client component that posts to a Next.js 15 Server Action in `apps/web/src/app/contact/actions.ts`. The Server Action validates with a server-side **zod** schema (new dep) and sends through a new **Resend** wrapper (new dep) at `apps/web/src/lib/resend.ts`. The Resend wrapper checks env vars at every invocation and gracefully degrades to a structured `{ ok: false, reason: "not-configured" }` when any of `RESEND_API_KEY` / `CONTACT_FORM_RECIPIENT` / `CONTACT_FORM_FROM` is missing — so the slice can merge before bristle.dev is DNS-verified in Resend; the form goes live the moment env vars land in Vercel. Both pages render in Editorial Light (next-themes still deferred to slice 2.6). All About body copy + every `@bristle.dev` address ship as `[PLACEHOLDER — review before production launch]` for founder pre-launch review (lighter discipline than slice 006's FR-012a — a single header comment per data file, no per-item sign-off bullets). **Two new top-level dependencies** added with §9.5 propose-first gates: `resend@^6.12.3` (named in §3 as locked email provider) and `zod@^4.4.3` (consistent with §5's "All forms validated with Zod schemas" rule).

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.
**Primary Dependencies**: existing — `@bristle/ui` (no new exports), `@bristle/shared` (`SITE_URL` consumed by both pages' metadata), `@bristle/db` (untouched — no DB reads this slice), Tailwind v4, `next/font/google`, `lucide-react@1.16.0` (existing; `LifeBuoy`, `Mail`, `Zap`, `ChevronRight` consumed by name), `@radix-ui/react-accordion@^1.2.12` (slice 006, unused this slice). **New runtime deps**: `resend@^6.12.3` (the Resend SDK; consumed only on the server in `lib/resend.ts` + `actions.ts`); `zod@^4.4.3` (form schema; consumed only on the server in `contact-schema.ts` + `actions.ts` — see decision §10 for client-bundle tree-shake). Both confirmed not yet present anywhere in the workspace at plan time.
**Storage**: N/A — both pages are content-static. No schema change, no new query helper, no `@bristle/db` touch. Form submissions are not persisted (the email IS the persistence — Resend → founder inbox).
**Testing**: gates only (typecheck/lint/build, greps, route 200 + meta-tag curl, bundle budgets, form submission walked in both env-var states). No Vitest/Playwright wired (same as slices 005 / 006 / 007). Server Action is testable in principle via Vitest; deferred (see decision §11).
**Target Platform**: Web (Vercel preview + production).
**Performance Goals (binding, §5)**: Lighthouse ≥90 Performance/Accessibility/Best-Practices on `/about` and `/contact`; First-Load JS < 180 KB gz **per route**; SEO 100 on local-prod (SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact and not a regression).
**Constraints**: zero hex literals, zero font-family literals in any new file; voice §6 (no `!`, no emoji, no "amazing/awesome"); no `localStorage`; WCAG 2.2 AA across both pages including the new form (labeled fields, `type="email"`, `required`, `aria-describedby` on error messages, focus rings); only the `ContactForm` carries `"use client"` — all other new components are Server Components or server-only modules.
**Scale/Scope**: 2 routes (1 wholesale rewrite + 1 new), 1 Server Action, 1 client component, 8 server section components, 4 content/data files, 1 Resend helper module, 1 `.env.example`. ~17 new files; 2 new top-level deps; 3 new env vars. Single edit to existing-on-main code = the `/about` route wholesale replacement (the rest is additive).

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS — with two recorded additions. `resend@^6.12.3` is the explicit §3 email provider — addition is the §9.5 propose-and-accept formality, recorded here. `zod@^4.4.3` is not explicitly listed in §3 but is mandated by §5 ("All forms validated with Zod schemas shared between server and client") — same propose-and-accept formality. Existing locked stack otherwise unchanged. `lucide-react` icons consumed by name (`LifeBuoy`, `Mail`, `Zap`, `ChevronRight`) — no whole-set import. |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens; the founder avatar is `bg-accent-bristle text-surface-card` (non-rotated square per clarification (g)); the pull-quote uses an accent left-border; the form fields use existing input tokens; the path-card chevron uses `lucide` `ChevronRight` at 1.5px stroke per §3. Zero hex literals, zero font-family literals (SC-021). |
| §5 Conventions + floors | PASS | Server Components default; client surface = **one** named file (`ContactForm`); kebab-case files / PascalCase components; Tailwind only; **no `localStorage`** (form submission is one-shot; no draft preservation client-side; on error the values come back from the Server Action via `prevState`); **Zod schema shared between server and client per §5** — the schema is imported by the Server Action server-side and (optionally) by the client form for preview validation (see decision §4); perf/a11y floors are explicit SCs; form is keyboard-reachable + screen-reader-labeled (SC-007). |
| §6 Voice | PASS | About body copy verbatim per user brief; Contact UI strings ("Get in touch.", "One inbox. Replies within a business day.", "Send message", "We respond within one business day.", "Message sent.", "Could not send right now…") all plain-spoken — no exclamation marks, no emoji, no "amazing/awesome". Voice grep clean (SC-021). |
| §8 Repo structure | PASS | Per-page section components under `apps/web/src/components/about/` and `apps/web/src/components/contact/` (mirrors slice-005 `landing/` + slice-006 `pricing/` / `faq/`). Content data colocated with consumers (about-content, contact-paths, contact-topics, contact-schema). The Resend wrapper lives at `apps/web/src/lib/resend.ts` (cross-cutting infra for the web app, not a workspace package — single consumer this slice). The Server Action lives at `apps/web/src/app/contact/actions.ts` (Next.js App Router convention for route-colocated Server Actions). |
| §9 Never-do | PASS | No edits to `design/`, no edits to PDFs/docs; spec→plan→tasks→implement honored; building exactly the spec; **slice-005 nav and footer untouched** (FR-025 — the footer's Company column already links to `/about` and `/contact`, verified via grep at plan time); **slice-006 pricing/FAQ pages untouched** (their `/contact` references flip from 404 to 200 the moment this slice ships — no edit to those files); no `localStorage`. The `/about` route's wholesale replacement (slice-005 stub → full page) is the same shape as slice-006's `/pricing` replacement (FR-016 / decision §11 precedent) — values+structural replacement is allowed when the spec mandates the rewrite and the change is contained to one route file. |
| §10 Ambiguity | PASS | All 7 clarifications resolved in the spec (Resend graceful degradation, Server Action vs API route, spam protection deferred, mobile layout paths-first, NewsletterStub separate component, fixed byline date, non-rotated founder avatar). |

**Result**: PASS. Two new top-level dependencies recorded above under §9.5; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)
```text
specs/008-about-and-contact/
├── spec.md            # done (all clarifications resolved)
├── plan.md            # this file
├── research.md        # Phase 0 — the 13 decisions
├── contracts/
│   └── ui-and-db.md   # Phase 1 — content-data shapes + ContactFormState + Resend helper signature + Server Action contract
├── quickstart.md      # Phase 1 — gate recipe + SC mapping
├── checklists/
│   └── requirements.md  # passing
└── tasks.md           # Phase 2 — NOT created here
```

No `data-model.md` (per user direction — no schema change, no new DB shape; the content-data shapes are documented inline in `contracts/ui-and-db.md` instead).

### Source Code (exact file tree of changes/additions)
```text
apps/web/
├── .env.example                                  # ADD — documents 3 Resend env vars
├── package.json                                  # CHANGE — add resend ^6.12.3 + zod ^4.4.3 to dependencies
└── src/
    ├── lib/
    │   └── resend.ts                             # ADD — server-only: sendContactMessage helper, runtime env check, per-call SDK client
    ├── app/
    │   ├── about/
    │   │   └── page.tsx                          # REWRITE — replace slice-005 ComingSoon stub with full page (async Server Component)
    │   └── contact/
    │       ├── page.tsx                          # ADD — new async Server Component route
    │       └── actions.ts                        # ADD — "use server" Server Action; validates via zod + invokes lib/resend
    └── components/
        ├── about/
        │   ├── about-content.ts                  # ADD — content data + [PLACEHOLDER] header comment
        │   ├── hero.tsx                          # ADD — AboutHero (server)
        │   ├── body.tsx                          # ADD — AboutBody (server, <article>+<p>+<blockquote>)
        │   ├── founder-card.tsx                  # ADD — FounderCard (server, non-rotated accent square + initials)
        │   └── newsletter-stub.tsx               # ADD — NewsletterStub (server, disabled form, "v0.2.7" caption)
        └── contact/
            ├── contact-paths.ts                  # ADD — 3 ContactPath constants + [PLACEHOLDER] header for addresses
            ├── contact-topics.ts                 # ADD — ContactTopic enum + CONTACT_TOPIC_LABELS
            ├── contact-schema.ts                 # ADD — zod ContactFormSchema (server-only import)
            ├── hero.tsx                          # ADD — ContactHero (server)
            ├── contact-paths.tsx                 # ADD — ContactPaths (server, 3 cards stacked)
            ├── contact-form.tsx                  # ADD — ContactForm ("use client", useActionState)
            ├── contact-form-success.tsx          # ADD — ContactFormSuccess (server, renders by parent on success state)
            └── contact-form-error.tsx            # ADD — ContactFormError (server, inline banner above form on error state)
```

**Structure Decision**: page-local section components under `apps/web/src/components/{about,contact}/` mirrors slice-005's `landing/` and slice-006's `pricing/` / `faq/` precedent. Content data files colocated with their consumers (page-specific content, no cross-cutting reuse). The Resend helper lives in `apps/web/src/lib/` because it's web-app infra (the `pipeline` app may eventually have its own email needs — different keys, different sender — and we don't share `lib/` cross-app). The Server Action lives at `app/contact/actions.ts` per Next.js App Router convention (route-colocated `"use server"` actions). No tokens, problem cards, or DB helpers touched.

---

## The 13 required decisions

### 1. Page composition — **thin async Server Component entries composing per-section files**

Both routes mirror the slice-006 pattern: a thin async Server Component that renders the slice-005 chrome (`TopNav` + `SiteFooter`) around per-section components from `components/about/` or `components/contact/`.

**`apps/web/src/app/about/page.tsx`** composes:
`<TopNav/>` *(reused from slice 005)* → `<main>` containing `<AboutHero/>` → `<AboutBody/>` → `<FounderCard/>` → `<NewsletterStub/>` `</main>` → `<SiteFooter/>` *(reused)*.

**`apps/web/src/app/contact/page.tsx`** composes:
`<TopNav/>` *(reused)* → `<main>` containing a 2-column grid: left = `<ContactHero/>` + `<ContactPaths/>`; right = `<ContactForm/>` *(client)* `</main>` → `<SiteFooter/>` *(reused)*.

**Rationale**: maps 1:1 to spec sections + the per-section 4px gate; small reviewable diffs; matches slice-005 / 006 pattern exactly. The `<main>` wrap addresses the slice-005 follow-up flag (slice 005's `/` lacks `<main>` — slice 008's new pages get it from day one per the slice-006 STOP-3 precedent).

### 2. Server vs Client boundary — **one client file, everything else server**

The only file carrying `"use client"`:
- `apps/web/src/components/contact/contact-form.tsx` (uses `useActionState`)

Every other new file — both route entries, all 4 About section components (`hero`, `body`, `founder-card`, `newsletter-stub`), 2 Contact section components (`hero`, `contact-paths`), 2 Contact form helper components (`contact-form-success`, `contact-form-error`), the Server Action at `actions.ts`, and the Resend helper at `lib/resend.ts` — is a Server Component or server-only module. **Net: 1 client file, ~16 server/server-only files.**

**Rationale**: keeps client JS minimal (only the form-state hook needs client behavior); `ContactFormSuccess` and `ContactFormError` are pure JSX rendered by the form's parent based on the `useActionState` return — they don't need their own state. Server-side validation + server-rendered success/error markup means the JS-disabled flow (FR-011 / AC US2-5) works without any client code.

### 3. Server Action signature — **confirmed; minor refinement on the error state structure**

```ts
// apps/web/src/app/contact/actions.ts
"use server";

import { contactFormSchema } from "@/components/contact/contact-schema";
import { sendContactMessage } from "@/lib/resend";

export type ContactFormValues = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "validation-error"; fieldErrors: Partial<Record<keyof ContactFormValues, string>>; values: ContactFormValues }
  | { status: "transport-error"; values: ContactFormValues };

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> { /* ... */ }
```

**Refinement from your draft:** split the single `"error"` status into **two** discriminated statuses — `"validation-error"` and `"transport-error"`. Rationale: the focus-management logic in `ContactForm` (decision §7) needs to know whether to focus the first invalid field (validation case) vs the error banner (transport / not-configured case). A single `"error"` status with a `reason` subfield would force the focus useEffect to switch on `reason` inside the handler; two separate top-level statuses makes the discrimination type-level and simpler.

**Note on "submitting"**: omitted from the state union — `useActionState` exposes the pending boolean as the *third* tuple element, so we don't need a state status for it. The form computes its own pending UI from that flag.

**Note on `"not-configured"`**: collapsed into `"transport-error"` per the spec edge case ("the not-configured case and the send-failed case both surface the **same** error banner — the visitor doesn't need to distinguish"). The Server Action logs `reason: "not-configured"` server-side for the founder's diagnostic, but the client `ContactFormState` carries only the user-facing `"transport-error"` — fewer states, single banner copy, simpler UI logic.

**`values` preservation**: included on **both** error variants so the form can re-render with the user's inputs intact (edge case "Form re-submit after error" — visitor inputs are preserved). On `"success"` the values are not needed (the success state replaces the form).

### 4. Zod schema — **confirmed with one refinement on email normalization**

```ts
// apps/web/src/components/contact/contact-schema.ts
import { z } from "zod";
import { CONTACT_TOPIC_KEYS } from "./contact-topics";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100, "Name is too long."),
  email: z.string().trim().toLowerCase().email("That email address does not look valid."),
  topic: z.enum(CONTACT_TOPIC_KEYS, { message: "Please pick a topic." }),
  message: z.string().trim().min(10, "A few more words help us reply usefully.").max(2000, "Message is too long."),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

**Confirmations:** trim + lowercase on email, trim on name/message, kebab-case topic enum keys (`product-question` etc.), display labels in `contact-topics.ts`.

**Refinement:** Each field gets a **plain-language error message** in the schema rather than relying on zod's defaults ("Required" / "Invalid email"). Reason: the form's `aria-describedby` error text is user-visible copy and should match voice §6 — softer than "Invalid email". The error strings are pulled directly from `.zod()` issues server-side and surfaced via `fieldErrors` in the `ContactFormState`.

**Server-only import:** `contact-schema.ts` is imported by `actions.ts` (server) and by `contact-form.tsx` (client) only for the `ContactFormInput` *type* — `import type { ContactFormInput } from ...`. Next.js + tree-shaking should keep the zod runtime out of the client bundle (validated at build time in T021 via First Load JS budget; see decision §10).

### 5. Resend client — **confirmed: runtime env check + per-call SDK client**

```ts
// apps/web/src/lib/resend.ts
import "server-only";  // build-time guard that this never imports into a client bundle
import { Resend } from "resend";

export type SendContactMessageResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "transport" };

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;             // display label, not enum key
  message: string;
}): Promise<SendContactMessageResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_FORM_RECIPIENT;
  const from = process.env.CONTACT_FORM_FROM;
  if (!apiKey || !to || !from) return { ok: false, reason: "not-configured" };

  const resend = new Resend(apiKey);  // per-call client; SDK is lightweight (no connection pool, just an HTTP wrapper)
  try {
    const { error } = await resend.emails.send({
      to, from,
      replyTo: input.email,
      subject: `Bristle contact: ${input.topic} from ${input.name}`,
      text: renderEmailBody(input),
    });
    if (error) {
      console.error("[resend] send failed:", error);
      return { ok: false, reason: "transport" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[resend] threw:", err);
    return { ok: false, reason: "transport" };
  }
}

function renderEmailBody(input: { name: string; email: string; topic: string; message: string }): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Topic: ${input.topic}`,
    ``,
    `--`,
    ``,
    input.message,
  ].join("\n");
}
```

**Confirmations:**
- **Runtime env check on every invocation** (not memoized). Rationale: Vercel can change env vars without redeploy; a memoized check would lock-in the at-startup state. The check is three string reads — negligible cost. This makes the not-configured → configured transition work the moment env vars land in Vercel, no rebuild needed.
- **Per-call SDK client** (not singleton). Rationale: the Resend SDK is a thin HTTP wrapper (`fetch` under the hood, no connection pool, no persistent state); singleton vs per-call has no measurable perf difference. Per-call construction means we don't need to memoize the key-to-instance mapping; the function is genuinely pure-given-env.
- **`import "server-only"`** at the top. Next.js's `server-only` package throws a build error if this module is ever imported into a client component. Belt-and-suspenders against accidental bundling of the Resend SDK to the browser (which would expose the API key).

**Alternative considered:** singleton with lazy init at module load — rejected for the memoization concern above + the at-load-time env capture would mean a redeploy is needed to start sending after env vars land.

### 6. Email body shape — **confirmed: plain-text, dot-separator, reply-to = visitor's email**

```
Subject: Bristle contact: Product question from Cornel Okoth

Name: Cornel Okoth
Email: amalacornel@gmail.com
Topic: Product question

--

[visitor's message body, verbatim, multi-line OK, no HTML escaping needed for text/plain]
```

- **Subject** includes the topic display label (not the kebab-case key) and the visitor's name — the founder can triage at a glance from the inbox list view.
- **Body** is plain text (no HTML — keeps it simple, no escaping concerns, deliverability is better). Four labeled metadata lines, a blank line, a `--` separator, blank line, then the message verbatim. The `--` is the standard email signature/quote separator most clients recognize.
- **`replyTo`** = the visitor's submitted (and normalized via the schema's `toLowerCase`) email. Hitting reply in the inbox replies to the visitor, not to `contact@bristle.dev`. **This is the killer founder-UX feature** — without it, replying requires copy-pasting the address out of the body.
- **`from`** = `CONTACT_FORM_FROM` env var (e.g. `Bristle Contact <contact@bristle.dev>`). The visitor sees the email "from contact@bristle.dev" if they ever see the email (they shouldn't — but the founder's reply goes from the founder's actual address per `replyTo` mechanics).
- **`to`** = `CONTACT_FORM_RECIPIENT` env var (e.g. `hello@bristle.dev`, or the founder's personal Gmail until a real inbox is set up).

### 7. ContactForm focus management — **confirmed; useRef + useEffect on status transition**

```tsx
// apps/web/src/components/contact/contact-form.tsx (sketch)
"use client";
import { useActionState, useEffect, useRef } from "react";
import { submitContactForm, type ContactFormState } from "@/app/contact/actions";

const INITIAL: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      successHeadingRef.current?.focus();
    } else if (state.status === "validation-error") {
      // Focus the first field with an error, in form-tab-order.
      const firstInvalid = ["name", "email", "topic", "message"].find(
        (k) => state.fieldErrors[k as keyof typeof state.fieldErrors] != null,
      );
      if (firstInvalid && formRef.current) {
        const el = formRef.current.elements.namedItem(firstInvalid) as HTMLElement | null;
        el?.focus();
      }
    } else if (state.status === "transport-error") {
      errorBannerRef.current?.focus();
    }
  }, [state]);

  // ... renders <form action={action} ref={formRef}>, conditional ContactFormSuccess vs form-with-banner.
}
```

**Confirmations:**
- On `"validation-error"`: focus the first invalid field in form-tab-order (`name` → `email` → `topic` → `message`). The `find` over the ordered key array preserves tab-order regardless of `fieldErrors` insertion order.
- On `"transport-error"`: focus the error banner (which is `tabIndex={-1}` so it's focusable programmatically but not in the tab cycle).
- On `"success"`: focus the success heading (`role="status"` `aria-live="polite"` + `tabIndex={-1}` so screen readers announce it without an extra focus jump on render).
- Refs (`useRef`) not `data-test` attributes — refs are React-idiomatic and don't pollute the DOM. The Server Action returns `data-test` attributes are not needed; the form knows its own structure.

**Edge case**: on the visitor's *first* render the status is `"idle"` and the `useEffect` is a no-op (no focus move). On subsequent renders only the discriminated success/validation-error/transport-error branches fire focus.

### 8. Mobile breakpoints and stack order — **md breakpoint = 768px; mobile target width = 375 (matches responsive sweep)**

**`/about`**: single-column on all widths. The article naturally stacks (hero → body → founder card → newsletter stub). No breakpoint-conditional layout. Visual gate at T019 checks 320, 375, 768, 1024, 1280, 1440 widths for no h-scroll / overlap / clip.

**`/contact`**: 2-column above `md` (768px); single-column below `md` with **paths-first, form-second** order per clarification (d). Implementation: `grid md:grid-cols-2 gap-section` on the body container; below `md` the `grid` becomes `grid-cols-1` (Tailwind default), preserving the DOM order. Since the DOM order is `<ContactHero/>` → `<ContactPaths/>` → `<ContactForm/>` (in the left-then-right reading order on desktop), the mobile stack is the same order: hero → paths → form. No `order` utility needed.

**4px-tolerance gate at T019** checks **two widths per page**:
- `/about` at the design viewport (likely **1280** — match the PDF's render width) + at **375** for mobile reflow.
- `/contact` at **1280** for the two-column layout + at **375** for the paths-first stack.

The visual gate is human; the 4px tolerance applies per-section at each width. Implementor screenshots both widths per page.

### 9. Per-page metadata — **confirmed exact strings**

```ts
// apps/web/src/app/about/page.tsx
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

const TITLE = "About — Bristle";
const DESCRIPTION =
  "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/about",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

// apps/web/src/app/contact/page.tsx
const TITLE = "Contact — Bristle";
const DESCRIPTION =
  "Email, enterprise sales, or send us a message. One inbox, one business day.";
// metadata object structurally identical with url = SITE_URL + "/contact"
```

- **No `robots` field** on either page → indexable by default (FR-019).
- **OG image reused** unchanged from slice 005 (`/og-image.png` — 1200×630, deployed). No new raster this slice.
- Title format `Page — Bristle` matches slice 006 (`Pricing — Bristle`, `FAQ — Bristle`).

### 10. Performance/SEO budget — **strategy for keeping both pages under 180 KB gz**

- **`/about` should be lighter than slice-006's `/pricing` (108 KB)** because it has no client components at all. Expected: close to the baseline `/about` stub at 106 KB + about 1-2 KB of content. **Target: ~108 KB.**
- **`/contact` adds the ContactForm client component** — bundle additions:
  - `useActionState` is part of React 19 (already shipped in the baseline bundle).
  - The form's own JSX + focus-management `useEffect` + refs: ~1-2 KB.
  - **No zod on the client**: `contact-schema.ts` is imported by `actions.ts` (server) and as `import type { ContactFormInput }` from `contact-form.tsx` (type-only — erased at compile). `contact-form.tsx` does NOT call zod's runtime validators on the client; submission flows through the Server Action where zod runs server-side and returns `fieldErrors`. Native HTML `required` / `type="email"` / `maxlength` attributes provide preview-grade client validation for free. **Result: zod is server-only.** Verify at T019 via `pnpm --filter web build` First-Load JS for `/contact` (should be ~110-112 KB, not the ~130 KB it would be with zod on the client).
  - `lucide-react` icons imported **by name only** (`LifeBuoy`, `Mail`, `Zap`, `ChevronRight`) — same tree-shake pattern as slice 006 (`Check`, `ChevronDown`). Existing 1.16.0 supports per-icon named imports.
  - No other new client dep.
- **`resend` is server-only**: `lib/resend.ts` starts with `import "server-only"` (Next.js build-time guard). The SDK never reaches the client bundle.
- **No new fonts**: `next/font/google` already loads Inter / Source Serif Pro / JetBrains Mono in `apps/web/src/app/layout.tsx`; both new pages inherit. No on-page rasters (founder avatar is `<div>` + initials text).
- **LCP candidate** on both pages: the serif display headline (text, server-rendered, font `display:swap`) — same pattern as slice 005's `/` (107 KB, LCP < 2.5s).

### 11. Test surface — **confirmed: gates only; vitest deferred**

No automated test files this slice. Verification is the gate phase: typecheck/lint/build, Lighthouse on local prod build for each route, responsive sweep at 320/375/768/1024/1280/1440, keyboard-walk on the form (Tab order, focus rings, arrow-key on `<select>`, ESC/Enter/Space behaviors), hex/font-family/voice greps, visual-diff vs PDF p.2 + p.9 at the design viewport + 375 (human review), form-submission walk in both env-var states (not-configured → error banner; configured → success + actual email delivered).

**Server Action testable in principle via Vitest** — the function is pure given (`prevState`, `FormData`, `process.env`); mocking the Resend SDK would let the success path run without a real send. **Defer** to a future infra slice that stands up the Vitest harness (not trivial: monorepo + Server Action + Next.js module resolution + jsdom for any DOM tests). Risk R5 captures this — if the Server Action grows complex enough that manual gate-phase walks aren't enough, we'll revisit.

### 12. Risks, unknowns & tracked follow-ups

#### Risks (in-slice)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to the PDF across two pages × multiple sections (About has 5 visible blocks, Contact has 5) | High | Med | Map every dimension to tokens; screenshot-compare per section at the design viewport + 375; pull-quote accent bar, founder-card avatar shape (per clarification (g)), and ContactPaths chevron-indicator are the most-likely 4px-tolerance suspects. |
| R2 | Two new top-level deps (`resend`, `zod`) — both explicitly proposed under §9.5 here, but the user can still veto at review time | Low | Low | Both documented in §3 of this plan + Constitution Check; user veto window is now (pre-tasks). `zod` is mandated by §5 so the veto seems unlikely; `resend` is named in §3 so likewise. |
| R3 | `zod` runtime accidentally bundled to the client (would push `/contact` First-Load JS past budget) | Med | Med | `contact-form.tsx` imports `ContactFormInput` as a `import type` only; never calls `contactFormSchema.parse()` client-side; the Server Action does the validation. T019 verifies via `next build` First-Load JS for `/contact` (~110 KB expected; ~130+ KB would indicate accidental bundling). |
| R4 | Resend SDK or some transitive dep accidentally bundled to the client (exposing the API key, or just bloating the bundle) | Low | High | `lib/resend.ts` starts with `import "server-only"` — Next.js throws a build-time error if this module is ever imported from a client component. Belt-and-suspenders + the `actions.ts` Server Action is server-by-definition. T019 verifies via the same First-Load JS check. |
| R5 | Server Action logic grows complex enough that gate-phase manual walks miss a regression | Low | Med | Server Action is small this slice (validate → call helper → return state). If complexity grows (e.g. honeypot in a spam-protection follow-up, multi-recipient routing), spin up a Vitest harness in that slice. Tracked under "Tracked follow-ups". |
| R6 | Hidden hex/font-family literal slips into the new files (SC-021) | Med | Med | Grep gate against `apps/web/src/components/about/`, `apps/web/src/components/contact/`, the two route files, the Server Action, and `lib/resend.ts` for `#[0-9a-f]{3,8}` and `font-family` / `font-name` strings before commit. |
| R7 | Form submitted with JS disabled produces a different response payload than the JS-enhanced flow (regression on the progressive-enhancement contract) | Med | Med | T019 includes a JS-disabled walk: open `/contact` with JS off → submit valid input → confirm same success / error states render server-rendered. The Server Action shape is identical regardless of how the form was posted (native HTML form or `useActionState`-driven). |
| R8 | Resend domain verification for `bristle.dev` is incomplete at deploy time → env vars set but Resend rejects the `from` address → `"transport-error"` banner shows for all visitors who try to submit | Med | Med | This is the **expected** ship state (clarification (a) — graceful degradation). Visitors are guided to email `support@bristle.dev` directly via the banner copy. Once DNS verification completes, env vars work as intended and the form goes live. **Tracked**: founder confirms DNS verification status before flipping env vars in Vercel. |
| R9 | First-Load JS for `/about` or `/contact` exceeds 180 KB gz | Low | High | Strict tree-shake discipline (decision §10); T019 verifies. Slice 005 baseline `/about` stub is 106 KB, so we have ~74 KB budget; the form + content should fit comfortably. |
| R10 | Two newsletter stub markups (About inline + footer inline) drift over time | Low | Low | Documented as a tracked follow-up below — when 2.7 wires newsletter to a real Resend audience, both stubs likely fold into a shared component then. |

#### Tracked follow-ups (out of scope this slice)

- **Form spam protection** (per clarification (c)). The form is publicly submittable with only zod validation as protection. If spam volume becomes a problem post-launch, add a follow-up slice with either Cloudflare Turnstile (free tier; ~5KB JS + a `<Turnstile/>` widget) or Vercel KV-backed rate limiting (one-per-IP-per-60s — server-side, zero client JS, but adds a new dep). Honeypot is the cheapest middle ground (one hidden input; if it's non-empty, silently drop) — could go in pre-launch if needed.
- **Resend domain verification** for `bristle.dev` (DNS records: SPF, DKIM, optionally DMARC). Founder out-of-band; the slice ships gracefully degraded.
- **Vitest harness for Server Actions** (R5). Future infra slice. Don't add now — would expand slice 008's scope from "ship the form" to "ship the form + the test stack".
- **NewsletterStub markup duplication** (About + footer). When slice 2.7 wires newsletter to a real Resend audience, the two stubs likely converge into one shared `<NewsletterForm/>` component (both with the same interactive `onSubmit` flow). For now they're intentionally separate per clarification (e).
- **Slice-005 `<main>` follow-up** (carried over from slice 006 / 007 STOP 4). The slice-005 landing's `apps/web/src/app/page.tsx` lacks a `<main>` landmark; slice 008's new pages get `<main>` from day one (decision §1). Defer the slice-005 fix per §9 to a future micro-slice that touches landing chrome.
- **`/api/contact` route handler** (not the Server Action — a separate JSON API endpoint for non-form clients, e.g. a Slack integration that posts contact-form-equivalent payloads). Out of scope this slice and possibly forever — the Server Action is the canonical entry point. If a real API need arises, it's a different surface.

### 13. Implementation batching — **confirmed: 4 batches / 4 STOPs, mirroring slice 006**

- **Batch A / STOP 1 — Foundations** (~5-6 commits): add `resend` + `zod` deps to `apps/web/package.json`, create `.env.example` with the three Resend vars, write the four content data files (`about-content.ts`, `contact-paths.ts`, `contact-topics.ts`, `contact-schema.ts`), write the Resend helper (`lib/resend.ts`). Verification gate: typecheck + lint + `pnpm why resend` + `pnpm why zod` show clean trees.
- **Batch B / STOP 2 — Server Action + form primitives** (~4 commits): Server Action (`actions.ts`), `ContactForm` (client), `ContactFormSuccess`, `ContactFormError`. The interactive surface; this is where the most logic lives.
- **Batch C / STOP 3 — Server section components + routes** (~7-8 commits): `AboutHero`, `AboutBody`, `FounderCard`, `NewsletterStub`, `ContactHero`, `ContactPaths`, `/about/page.tsx` (replace stub), `/contact/page.tsx` (new route). Assembly.
- **Batch D / STOP 4 — Gates** (no commits): T019 local gate (typecheck/lint/build + bundle budgets verified against §10 expectations + Lighthouse + responsive sweep + greps + form submission walked in both env-var states + JS-disabled walk + visual-diff vs PDF) + T020 preview parity gate.

**Expected total: ~19-20 commits across the 4 batches**, similar size to slice 006 (22 tasks / 19 commits). Smaller than 006 because no Radix dep wiring (just two npm-package adds) and the FAQ scroll-spy custom JS was its own complexity center; here the form is a single client component.

## Order of operations
1. **T001-T006** (Batch A): `resend` + `zod` to `apps/web/package.json` → `pnpm install` → `.env.example` → four content-data files → `lib/resend.ts`. Each as its own commit. Verification at end of batch.
2. **T007-T010** (Batch B): `actions.ts` → `contact-form.tsx` → `contact-form-success.tsx` → `contact-form-error.tsx`. Each its own commit.
3. **T011-T018** (Batch C): About sections → Contact sections → both `page.tsx` files (with metadata exports). Each its own commit.
4. **T019-T020** (Batch D): T019 local gate (no commit), T020 preview parity (no commit).

T001 (dep add) gates the whole slice — must run `pnpm install` before any new server file can import from `resend` or `zod`. Within Batch C, the page.tsx files block on their respective sections being in place. T020 (preview) blocks on T019 (local) + a successful push to origin.

## Complexity Tracking
No constitution violations — section intentionally empty. Two new top-level deps recorded above in Constitution Check + decision §1; not violations, just §9.5 propose-and-accept additions consistent with §3 / §5.
