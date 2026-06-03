// Category key → human label. Single source of truth shared by apps/web and any
// future consumer. Keys align 1:1 with @bristle/ui's ProblemCardFull CategoryColor.
export const CATEGORY_LABELS = {
  payments: "Payments",
  devtools: "Devtools",
  "ai-ml": "AI / ML",
  "auth-sso": "Auth & SSO",
  deployment: "Deployment",
  analytics: "Analytics",
  mobile: "Mobile",
  email: "Email",
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

/**
 * Bristle categories.
 *
 * Sourced from design 3_2 (slice 015). 18 entries shipped as final for this slice.
 *
 * TF-015 (tracked): refine as product matures + real problems surface. The right
 * list may differ once problem-data informs which categories actually matter to users.
 */
export interface Category {
  slug: string;
  label: string;
  description?: string;
  iconName?: string;
}

// Row-major from design 3_2's 3-column grid. The onboarding watch-list is its own
// concern, distinct from CATEGORY_LABELS above (the 8 problem-card tint keys) — the
// slugs deliberately diverge where the lists overlap (e.g. mobile-dev vs mobile).
export const CATEGORIES: ReadonlyArray<Category> = [
  { slug: "devtools", label: "Devtools" },
  { slug: "payments", label: "Payments" },
  { slug: "ai-ml", label: "AI / ML" },
  { slug: "auth-sso", label: "Auth & SSO" },
  { slug: "deployment", label: "Deployment" },
  { slug: "analytics", label: "Analytics" },
  { slug: "mobile-dev", label: "Mobile dev" },
  { slug: "dataops", label: "DataOps" },
  { slug: "no-code-low-code", label: "No-code / Low-code" },
  { slug: "browsers", label: "Browsers" },
  { slug: "security", label: "Security" },
  { slug: "design-tools", label: "Design tools" },
  { slug: "email-comms", label: "Email / Comms" },
  { slug: "calendaring", label: "Calendaring" },
  { slug: "content-cms", label: "Content / CMS" },
  { slug: "education-tech", label: "Education tech" },
  { slug: "health-tech", label: "Health tech" },
  { slug: "climate", label: "Climate" },
];
