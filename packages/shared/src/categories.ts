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
