# Contracts: UI + DB surfaces (Slice 008)

## `@bristle/db` — **no change**

This slice does not modify, add, or remove any DB query helper. The slice-005 / 006 / 007 surface (`getFirstProblem`, `getProblemBySlug`, `getRecentProblems`, `getDb`) is preserved as-is. Neither new route reads from the database. Form submissions are NOT persisted to the DB — the email IS the persistence.

## `@bristle/ui` — **no API change; no new dep**

No new components exported. No existing exports modified. No new package dependency. `@radix-ui/react-accordion@^1.2.12` (slice 006) is unused this slice.

## `@bristle/shared` — **no change**

`SITE_URL` is consumed (not modified) by both new routes' `metadata` exports.

## `apps/web` — **two new top-level dependencies**

Added to `apps/web/package.json` `dependencies`:

```json
{
  "resend": "^6.12.3",
  "zod": "^4.4.3"
}
```

Confirmed not present anywhere in the workspace at plan time. Latest stable versions retrieved live via `pnpm view`. Both are §9.5 propose-and-accept additions consistent with §3 (Resend named explicitly) and §5 (zod mandated by "All forms validated with Zod schemas shared between server and client").

## `apps/web/.env.example` — **new file**

```
# Resend — contact form delivery (slice 008)
# All three required for the contact form to send. If any is missing at runtime,
# the form gracefully degrades to its inline error banner ("Could not send right
# now. Email us directly at support@bristle.dev and we'll respond from there.").

# Resend API key — get from https://resend.com/api-keys
RESEND_API_KEY=

# Inbox that receives contact-form submissions (must be a real address you check).
# Default suggestion: hello@bristle.dev
CONTACT_FORM_RECIPIENT=

# Sender identity for the email (format: "Display Name <address@your-verified-domain>").
# The domain in the address MUST be verified in Resend.
# Default suggestion: Bristle Contact <contact@bristle.dev>
CONTACT_FORM_FROM=
```

## New app-local files (no public package surface)

These live under `apps/web/src/{components/about,components/contact,app/about,app/contact,lib}/` — page-specific and infra-specific, not re-exported.

### About — content data + components

```ts
// apps/web/src/components/about/about-content.ts (TS module, no JSX)
// [PLACEHOLDER — review before production launch]
export interface AboutByline { publishedDate: string; author: string; readTime: string; }
export interface AboutFounder { initials: string; name: string; bio: string; }
export interface AboutContent {
  byline: AboutByline;
  paragraphs: readonly string[];           // 5 entries, in display order
  pullQuote: string;                       // rendered as <blockquote>
  pullQuoteInsertAfterParagraph: number;   // zero-based index; 1 = after paragraph 2
  founder: AboutFounder;
}
export const ABOUT_CONTENT: AboutContent;  // 5 paragraphs + 1 pull-quote + founder data + byline

// apps/web/src/components/about/hero.tsx (server)
export function AboutHero(): JSX.Element;
//   eyebrow "ABOUT BRISTLE" + serif display headline + byline

// apps/web/src/components/about/body.tsx (server)
export function AboutBody(): JSX.Element;
//   <article> containing <p> for each ABOUT_CONTENT.paragraphs entry, with
//   <blockquote> rendered after paragraphs[pullQuoteInsertAfterParagraph]

// apps/web/src/components/about/founder-card.tsx (server)
export function FounderCard(): JSX.Element;
//   non-rotated bg-accent-bristle size-12 square + "CO" initials in surface-card
//   + name + bio (per clarification (g): NOT the brand-diamond rotation)

// apps/web/src/components/about/newsletter-stub.tsx (server)
export function NewsletterStub(): JSX.Element;
//   eyebrow + serif heading + disabled email input + disabled Subscribe button +
//   "Subscriptions open in v0.2.7." caption (per clarification (e): NOT a reuse
//   of the slice-005 footer stub markup)
```

### Contact — content data + form + components

```ts
// apps/web/src/components/contact/contact-topics.ts (TS module)
export const CONTACT_TOPIC_KEYS = [
  "product-question",
  "bug-report",
  "enterprise-inquiry",
  "press-or-other",
] as const;
export type ContactTopic = (typeof CONTACT_TOPIC_KEYS)[number];
export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  "product-question": "Product question",
  "bug-report": "Bug report",
  "enterprise-inquiry": "Enterprise inquiry",
  "press-or-other": "Press or other",
};

// apps/web/src/components/contact/contact-paths.ts (TS module)
// [PLACEHOLDER — review DNS/email setup before production launch]
export interface ContactPath {
  label: string;
  subtitle: string;
  iconName: "LifeBuoy" | "Mail" | "Zap";
  href: string;
}
export const CONTACT_PATHS: readonly ContactPath[];  // 3 entries per spec FR-009

// apps/web/src/components/contact/contact-schema.ts (TS module — SERVER-ONLY runtime)
import { z } from "zod";
export const contactFormSchema: z.ZodObject<{ name, email, topic, message }>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
//   name:    z.string().trim().min(1, "Please add your name.").max(100, "Name is too long.")
//   email:   z.string().trim().toLowerCase().email("That email address does not look valid.")
//   topic:   z.enum(CONTACT_TOPIC_KEYS, { message: "Please pick a topic." })
//   message: z.string().trim().min(10, "A few more words help us reply usefully.").max(2000, "Message is too long.")

// apps/web/src/components/contact/hero.tsx (server)
export function ContactHero(): JSX.Element;
//   eyebrow "CONTACT" + serif headline "Get in touch." + subhead

// apps/web/src/components/contact/contact-paths.tsx (server)
export function ContactPaths(): JSX.Element;
//   3 stacked cards from CONTACT_PATHS; each: lucide icon (1.5px stroke) + label
//   + subtitle + lucide ChevronRight indicator

// apps/web/src/components/contact/contact-form.tsx ("use client") — THE ONLY CLIENT FILE
export function ContactForm(): JSX.Element;
//   uses useActionState(submitContactForm, INITIAL_STATE);
//   refs for formRef + errorBannerRef + successHeadingRef;
//   useEffect on [state] performs focus management per decision §7;
//   on success: renders <ContactFormSuccess/>;
//   on error: renders <ContactFormError/> above the form, form re-renders with state.values;
//   on idle/validation-error: renders the form with field-level errors via aria-describedby

// apps/web/src/components/contact/contact-form-success.tsx (server)
export function ContactFormSuccess(): JSX.Element;
//   "Message sent." h2 (ref'd by parent, tabIndex={-1}, role="status", aria-live="polite")
//   + "We'll be in touch within one business day. — Cornel" body

// apps/web/src/components/contact/contact-form-error.tsx (server)
export function ContactFormError(): JSX.Element;
//   inline banner above form: "Could not send right now. Email us directly at
//   support@bristle.dev and we'll respond from there."
//   ref'd by parent, tabIndex={-1}, role="alert"
```

### Server Action

```ts
// apps/web/src/app/contact/actions.ts
"use server";

import type { ContactFormInput } from "@/components/contact/contact-schema";

export type ContactFormValues = ContactFormInput;

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "validation-error"; fieldErrors: Partial<Record<keyof ContactFormValues, string>>; values: ContactFormValues }
  | { status: "transport-error"; values: ContactFormValues };

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState>;
//   1. Read formData fields into a plain object.
//   2. contactFormSchema.safeParse(plainObject)
//      - if !success: return { status: "validation-error", fieldErrors, values: plainObject }
//   3. await sendContactMessage(parsedData)
//      - if !ok: return { status: "transport-error", values: parsedData }
//      - if ok:  return { status: "success" }
```

### Resend helper

```ts
// apps/web/src/lib/resend.ts (SERVER-ONLY — starts with `import "server-only"`)
import "server-only";
import { Resend } from "resend";

export type SendContactMessageResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "transport" };

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;             // display label (not enum key) — passed in by actions.ts
  message: string;
}): Promise<SendContactMessageResult>;
//   - Read RESEND_API_KEY / CONTACT_FORM_RECIPIENT / CONTACT_FORM_FROM from process.env
//     on EVERY invocation (not memoized).
//   - If any missing: return { ok: false, reason: "not-configured" }
//   - Construct new Resend(apiKey) PER CALL (not singleton).
//   - resend.emails.send({ to, from, replyTo: input.email, subject, text })
//   - On Resend error or throw: console.error(...) + return { ok: false, reason: "transport" }
//   - On success: return { ok: true }
```

## Route metadata exports

### `apps/web/src/app/about/page.tsx`

```ts
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "About — Bristle",
  description: "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes.",
  openGraph: {
    title: "About — Bristle",
    description: "Bristle is multi-source problem discovery for builders. Made with evidence, not vibes.",
    type: "website",
    url: SITE_URL + "/about",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};
// NO robots field → indexable by default (FR-019)
```

### `apps/web/src/app/contact/page.tsx`

```ts
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Contact — Bristle",
  description: "Email, enterprise sales, or send us a message. One inbox, one business day.",
  openGraph: {
    title: "Contact — Bristle",
    description: "Email, enterprise sales, or send us a message. One inbox, one business day.",
    type: "website",
    url: SITE_URL + "/contact",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};
// NO robots field → indexable by default (FR-019)
```

Both routes export their default async Server Component composing the slice-005 `TopNav` + the per-page sections + the slice-005 `SiteFooter`. The `/about` route's wholesale replacement removes the slice-005 `ComingSoon` import and its `robots: noindex` metadata.

## Untouched contracts (additive-only verification)

- `apps/web/src/components/landing/top-nav.tsx` — unchanged
- `apps/web/src/components/landing/site-footer.tsx` — unchanged (Company column already links to `/about` line 16 + `/contact` line 18 — both light up automatically on slice merge; verified via grep at plan time)
- `apps/web/src/components/landing/pricing-teaser.tsx` — unchanged
- All slice-006 pricing/FAQ files — unchanged
- `packages/db/`, `packages/shared/`, `packages/ui/` — unchanged
- `design/` — unchanged

## Out-of-scope-known-404 CTAs consumed by this slice (not 2.3 defects)

None this slice. The four `/contact` references in shipped slice-006 chrome (Enterprise card "Contact sales →", FAQ Still-Stuck "Contact support →", FAQ bottom CTA "Open a ticket →", plus any other reference) all flip from 404 to 200 the moment this slice ships — no edit to slice-006 files.

`/faq` (consumed by the Help-center path card) is real since slice 006. `mailto:support@bristle.dev` and `mailto:sales@bristle.dev` (consumed by the Email support and Enterprise sales path cards) are protocol handlers, not Bristle routes — the visitor's email client handles them.

## Environment-variable contract (production launch checklist)

Before flipping the form live in production, the founder must:
1. Verify the `bristle.dev` domain in Resend (SPF + DKIM records; DMARC recommended).
2. Confirm a real inbox exists at `CONTACT_FORM_RECIPIENT` (default: `hello@bristle.dev`).
3. Add all three env vars to the Vercel project settings (Production environment).
4. Trigger a redeploy (or wait for the next push) so Vercel picks up the env vars.
5. Submit a test form on production; confirm the email arrives and `replyTo` works.

Slice 008 ships with graceful degradation if any of the above is incomplete — the form returns the inline error banner instead of crashing. No code change required to flip on.
