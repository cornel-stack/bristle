import type { NewCategory } from "../schema";

// The 8 canonical product categories (§4.1a-tinted keys, slice 016 D9). These are
// the only categories the seven screens render. `problemCount` is the design's
// displayed LITERAL (not count(*) over fixtures — the sidebar shows global indexed
// counts). `tint*Key` name the existing §4.1a design tokens. `momentumSeries` is
// the per-category sparkline (CategoryMomentumSeriesSchema shape). Email/Comms
// carries no on-screen count, so its literal is a plausible chosen value.
export const CATEGORIES: NewCategory[] = [
  {
    key: "devtools",
    label: "Devtools",
    tintBgKey: "category-devtools-bg",
    tintFgKey: "category-devtools-fg",
    problemCount: 142,
    momentumSeries: { points: [88, 92, 95, 99, 104, 108, 113, 119, 126, 132, 138, 142] },
    position: 0,
  },
  {
    key: "ai-ml",
    label: "AI / ML",
    tintBgKey: "category-ai-ml-bg",
    tintFgKey: "category-ai-ml-fg",
    problemCount: 124,
    momentumSeries: { points: [71, 76, 80, 86, 92, 98, 103, 109, 114, 118, 121, 124] },
    position: 2,
  },
  {
    key: "payments",
    label: "Payments",
    tintBgKey: "category-payments-bg",
    tintFgKey: "category-payments-fg",
    problemCount: 86,
    momentumSeries: { points: [70, 71, 72, 74, 75, 77, 78, 80, 81, 83, 84, 86] },
    position: 1,
  },
  {
    key: "deployment",
    label: "Deployment",
    tintBgKey: "category-deployment-bg",
    tintFgKey: "category-deployment-fg",
    problemCount: 67,
    momentumSeries: { points: [54, 55, 57, 58, 60, 61, 62, 63, 64, 65, 66, 67] },
    position: 4,
  },
  {
    key: "mobile",
    label: "Mobile",
    tintBgKey: "category-mobile-bg",
    tintFgKey: "category-mobile-fg",
    problemCount: 58,
    momentumSeries: { points: [41, 43, 45, 47, 48, 50, 51, 53, 54, 55, 57, 58] },
    position: 6,
  },
  {
    key: "auth-sso",
    label: "Auth & SSO",
    tintBgKey: "category-auth-sso-bg",
    tintFgKey: "category-auth-sso-fg",
    problemCount: 41,
    momentumSeries: { points: [33, 34, 35, 36, 36, 37, 38, 38, 39, 40, 40, 41] },
    position: 3,
  },
  {
    key: "analytics",
    label: "Analytics",
    tintBgKey: "category-analytics-bg",
    tintFgKey: "category-analytics-fg",
    problemCount: 35,
    momentumSeries: { points: [28, 29, 29, 30, 31, 31, 32, 33, 33, 34, 34, 35] },
    position: 5,
  },
  {
    key: "email",
    label: "Email / Comms",
    tintBgKey: "category-email-bg",
    tintFgKey: "category-email-fg",
    problemCount: 29,
    momentumSeries: { points: [22, 23, 23, 24, 25, 25, 26, 27, 27, 28, 28, 29] },
    position: 7,
  },
];
