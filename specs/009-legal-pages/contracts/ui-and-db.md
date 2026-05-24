# Contracts: UI + DB surfaces (Slice 009)

## `@bristle/db` — **no change**

This slice does not modify, add, or remove any DB query helper. No DB reads. No schema change. The slice-005 through slice-008 surface is preserved as-is.

## `@bristle/ui` — **no API change; no new dep**

No new components exported. No existing exports modified. No new package dependency.

## `@bristle/shared` — **no change**

`SITE_URL` is consumed (not modified) by all four new routes' `metadata` exports.

## `apps/web` — **no new top-level dependency**

`apps/web/package.json` is **unchanged**. `pnpm-lock.yaml` is unchanged. TocRail is hand-rolled `IntersectionObserver`, same pattern as slice-006 FAQ rail.

## New app-local files (no public package surface)

These live under `apps/web/src/components/legal/` (new directory) and `apps/web/src/app/{terms,privacy,security,gdpr}/` — page-specific, not re-exported.

### Shared type module

```ts
// apps/web/src/components/legal/types.ts (TS module, no JSX)

export interface LegalHeroContent {
  /** e.g. "LEGAL" — renders in accent-bristle, small-caps uppercase. */
  eyebrow: string;
  /** e.g. "Terms of Service" — renders as the page's <h1> via LegalHero. */
  headline: string;
  /**
   * Last-updated dates. `posted` is required; `effective` is optional (omitted
   * on Security + GDPR per clarification (c) / spec §11 + §12 — those pages
   * are continuously-updated practice statements, not contracts).
   *
   * Stored as plain strings (e.g. "2026-05-24"); LegalHero renders them as
   * "Last updated · {posted}" or "Last updated · {posted} · Effective {effective}".
   */
  lastUpdated: {
    posted: string;
    effective?: string;
  };
}

export interface LegalSectionContent {
  /** kebab-case; serves as both the <section id> anchor target AND the
   *  [data-legal-section] marker the TocRail's IntersectionObserver queries. */
  id: string;
  /** 1-10; rendered as "{number}. {title}" in the <h2>. */
  number: number;
  /** e.g. "Subscriptions & billing"; renders in serif h2. */
  title: string;
  /** 1+ verbatim paragraphs; each renders as a <p> element in display order. */
  paragraphs: ReadonlyArray<string>;
  /**
   * Optional [REVIEW: ...] developer note flagging a founder/legal sign-off
   * item. **NEVER rendered to the user-visible page** (per FR-018). Surfaces
   * via source, PR description, and the pre-launch review checklist. The
   * LegalSection component reads `paragraphs` only.
   */
  reviewNote?: string;
}

export interface LegalContent {
  hero: LegalHeroContent;
  /** Exactly 10 entries per FR-014; order matters (rendered in source order
   *  + section numbers must match). */
  sections: ReadonlyArray<LegalSectionContent>;
}

/** Minimal projection consumed by TocRail. LegalLayout maps content.sections
 *  to TocItem[] before passing into the rail — keeps the rail's prop surface
 *  tight and avoids serializing paragraph prose for client hydration. */
export interface TocItem {
  id: string;
  number: number;
  title: string;
}
```

### Content data files

Each file conforms to `LegalContent` and exports a single named constant.

```ts
// apps/web/src/components/legal/terms-content.ts (sketch)
// [PLACEHOLDER — legal review needed before production launch]

import type { LegalContent } from "./types";

export const TERMS_CONTENT: LegalContent = {
  hero: {
    eyebrow: "LEGAL",
    headline: "Terms of Service",
    lastUpdated: { posted: "2026-05-24", effective: "2026-05-24" },
  },
  sections: [
    {
      id: "overview",
      number: 1,
      title: "Overview",
      paragraphs: [
        "These terms govern your use of Bristle ('the Service'), operated by Bristle Research ('we', 'us'). By creating an account or using any part of the Service, you agree to these terms. If you are using the Service on behalf of an organization, you accept these terms on that organization's behalf.",
      ],
      reviewNote:
        "legal entity name. Currently 'Bristle Research' — change to the registered legal entity (e.g. 'Bristle Research, Inc.' or 'Bristle Research Ltd.') once incorporated.",
    },
    // ... 9 more sections per spec §9
  ],
};
```

Same shape for `privacy-content.ts`, `security-content.ts`, `gdpr-content.ts` — each exports `PRIVACY_CONTENT`, `SECURITY_CONTENT`, `GDPR_CONTENT` respectively. Section bodies verbatim per spec §§9-12. Security and GDPR omit `lastUpdated.effective`.

### Server components

```tsx
// apps/web/src/components/legal/legal-hero.tsx (server)
export interface LegalHeroProps { hero: LegalHeroContent; }
export function LegalHero(props: LegalHeroProps): JSX.Element;
//   left-aligned hero: <p>eyebrow in accent-bristle</p>
//                       <h1>headline in font-serif text-display-lg</h1>
//                       <p>Last updated · {posted}[ · Effective {effective}]</p>

// apps/web/src/components/legal/legal-section.tsx (server)
export interface LegalSectionProps { section: LegalSectionContent; }
export function LegalSection(props: LegalSectionProps): JSX.Element;
//   <section id={section.id} data-legal-section={section.id}>
//     <h2>{section.number}. {section.title}</h2>
//     {section.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
//   </section>
//   NOTE: section.reviewNote is read-only data on the type; NOT rendered.

// apps/web/src/components/legal/legal-layout.tsx (server) — composes the page
export interface LegalLayoutProps { content: LegalContent; }
export function LegalLayout(props: LegalLayoutProps): JSX.Element;
//   <TopNav /> (reused from slice 005)
//   <main className="mx-auto max-w-6xl px-grid">
//     <LegalHero hero={content.hero} />
//     <div className="grid gap-grid pb-section md:grid-cols-[16rem_1fr] md:gap-section">
//       <TocRail items={tocItems} />
//       <div className="flex flex-col gap-section">
//         {content.sections.map(s => <LegalSection key={s.id} section={s} />)}
//       </div>
//     </div>
//   </main>
//   <SiteFooter /> (reused from slice 005)
```

### Client component

```tsx
// apps/web/src/components/legal/toc-rail.tsx ("use client") — THE ONLY CLIENT FILE
export interface TocRailProps { items: ReadonlyArray<TocItem>; }
export function TocRail(props: TocRailProps): JSX.Element;
//   "use client";
//   useState<string>(items[0]?.id ?? "") for active section
//   useRef<Map<string, number>>(new Map()) for visibleItems (IO tracking)
//   useRef<Map<string, HTMLAnchorElement>>(new Map()) for mobilePillRefs
//
//   useEffect (mount-only) sets up IntersectionObserver on
//     document.querySelectorAll("[data-legal-section]")
//     with rootMargin "-80px 0px -55% 0px", threshold: 0
//     topmost-intersecting → setActive; no-intersection → early return (no flicker)
//
//   useEffect ([active]) auto-scrolls mobile pill into view:
//     if (matchMedia("(min-width: 768px)").matches) return;  // desktop no-op
//     pillRef.scrollIntoView({inline: "center", block: "nearest",
//                             behavior: reduced-motion ? "auto" : "smooth"})
//
//   handleClick(e, sectionId):
//     if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;  // let browser handle modified clicks
//     e.preventDefault();
//     target = document.getElementById(sectionId);
//     reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
//     target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
//
//   render <nav aria-label="Sections of the page">
//     <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
//       desktop sticky vertical rail; <a href="#{id}" aria-current={isActive ? "location" : undefined}>
//         {item.number}. {item.title}
//       </a>
//       active item: border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary
//       inactive: border-l-2 border-transparent py-1 pl-snug text-text-secondary hover:text-text-primary
//     </ul>
//     <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
//       mobile horizontal pill row; each pill an <a> with ref registered to mobilePillRefs Map;
//       active pill: bg-text-primary text-surface-card rounded-pill
//       inactive: border border-border-default bg-surface-card text-text-secondary rounded-pill
//     </ul>
//   </nav>
```

## Route metadata exports

### `apps/web/src/app/terms/page.tsx`

```ts
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { LegalLayout } from "@/components/legal/legal-layout";
import { TERMS_CONTENT } from "@/components/legal/terms-content";

const TITLE = "Terms of Service — Bristle";
const DESCRIPTION =
  "The terms that govern your use of Bristle, including account, billing, cancellation, and liability.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/terms",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function Terms() {
  return <LegalLayout content={TERMS_CONTENT} />;
}
// NO robots field → indexable by default (FR-016)
```

### `apps/web/src/app/privacy/page.tsx`

```ts
// ... same structure as terms; title = "Privacy Policy — Bristle"
// description = "What data Bristle collects, why we collect it, and the rights you have over it."
// url = SITE_URL + "/privacy"
// content = PRIVACY_CONTENT
```

### `apps/web/src/app/security/page.tsx`

```ts
// ... title = "Security — Bristle"
// description = "How Bristle protects customer data and how to report security issues."
// url = SITE_URL + "/security"
// content = SECURITY_CONTENT
```

### `apps/web/src/app/gdpr/page.tsx`

```ts
// ... title = "GDPR Compliance — Bristle"
// description = "Bristle's specific commitments to EU and UK data subjects under GDPR."
// url = SITE_URL + "/gdpr"
// content = GDPR_CONTENT
```

All four routes export an async Server Component with no `"use client"`. All four reuse the slice-005 OG image. None set `robots: noindex`.

## Untouched contracts (additive-only verification)

- `apps/web/src/components/landing/site-footer.tsx` — **unchanged** (Legal column hrefs already point at `/terms`, `/privacy`, `/security`, `/gdpr` from slice 005 — verified via grep at plan time; all four light up automatically on slice merge)
- `apps/web/src/components/landing/top-nav.tsx` — **unchanged** (reused)
- `apps/web/src/components/landing/pricing-teaser.tsx` — **unchanged**
- All slice-006 pricing/FAQ files — **unchanged** (including `apps/web/src/components/faq/scroll-spy-rail.tsx` — TocRail is a structural mirror in a separate file, NOT a refactor of the FAQ rail; FR-008 / decision §D6)
- All slice-008 about/contact files — **unchanged**
- `apps/web/src/lib/resend.ts` (slice 008) — **unchanged**
- `apps/web/src/app/contact/actions.ts` (slice 008) — **unchanged**
- `packages/db/`, `packages/shared/`, `packages/ui/` — **unchanged**
- `design/` — **unchanged**

## Out-of-scope-known-404s consumed by this slice (not 2.3-part-2 defects)

- `/privacy/sub-processors` — referenced from Privacy section 5 and GDPR section 6 prose; NOT built this slice. Becomes a follow-up route (likely slice 2.7 or a dedicated sub-processors slice). Visitors clicking the inline link land on Next.js 404. Documented in Assumptions §"No `/privacy/sub-processors` deep page".
- `/changelog` — referenced from Privacy section 10 prose ("The full revision history is on our /changelog page."). Currently a slice-005 ComingSoon stub; becomes real in slice 2.5.
- `/status` — referenced from Security section 6 prose ("Status updates during ongoing incidents are posted at /status."). Currently 404; becomes real in slice 2.7 (Better Stack status integration).

All three are informational inline links in the legal prose — not buttons, not CTAs. Visitors who follow them land on slice-005 stubs or Next.js 404, NOT slice-009 defects.

## Cross-slice integrity constraint (permanent)

**Refund policy alignment** (FR-015): Terms section 6 ("Cancellation & refunds") and FAQ q-5 (slice 008, "Do you offer a refund?") must remain semantically aligned. Any future slice that edits one MUST audit the other. The `[REVIEW: ...]` marker on Terms section 6 in `terms-content.ts` flags this; the PR description's pre-launch review checklist surfaces it; this contract document records it as a permanent cross-slice constraint.
