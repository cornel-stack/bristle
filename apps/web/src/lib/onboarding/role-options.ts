// Onboarding Step 1 roles (design 3_1). ROLE_VALUES is the source-of-truth tuple
// (drives `Role`, `isRole`, and the saveRole Zod enum in Batch B); ROLE_OPTIONS is
// the ordered render list (design grid order, row-major) carrying the display copy.
//
// `description` is verbatim from design 3_1. `previewLine` is the per-role "your
// dashboard will lead with …" footer copy (FR-010); the indie_founder line is
// verbatim from the design, the rest follow its register (TF-013 — founder may
// refine). `iconName` is a lucide icon resolved by RoleCard.

export const ROLE_VALUES = [
  "indie_founder",
  "product_manager",
  "agency_studio",
  "innovation_lab",
  "researcher",
  "other",
] as const;

export type Role = (typeof ROLE_VALUES)[number];

export function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}

export interface RoleOption {
  slug: Role;
  label: string;
  description: string;
  previewLine: string;
  iconName: string;
}

export const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  {
    slug: "indie_founder",
    label: "Indie founder",
    description:
      "Looking for the next product to start. I want frequency, momentum, and willingness-to-pay signals.",
    previewLine:
      "Your dashboard will lead with frequency and willingness-to-pay.",
    iconName: "Zap",
  },
  {
    slug: "product_manager",
    label: "Product manager",
    description:
      "Already shipping. I want evidence to defend roadmap decisions to leadership.",
    previewLine:
      "Your dashboard will lead with evidence you can take into a roadmap review.",
    iconName: "Layers",
  },
  {
    slug: "agency_studio",
    label: "Agency / studio",
    description:
      "Build for clients. I want sharable briefs and category dashboards across multiple verticals.",
    previewLine:
      "Your dashboard will lead with sharable briefs across the verticals you pick.",
    iconName: "Shuffle",
  },
  {
    slug: "innovation_lab",
    label: "Innovation lab / scout",
    description:
      "Map emerging pain across categories. Team seats, shared collections, and an API matter most.",
    previewLine:
      "Your dashboard will lead with emerging pain across categories, built for a team.",
    iconName: "TrendingUp",
  },
  {
    slug: "researcher",
    label: "Researcher / student",
    description:
      "Curious about product discovery. Need a flexible read of the data, not a dashboard.",
    previewLine:
      "Your dashboard will lead with a flexible, exploratory read of the data.",
    iconName: "User",
  },
  {
    slug: "other",
    label: "Something else",
    description:
      "Tell us in your own words. We tailor the dashboard based on your answer.",
    previewLine: "Your dashboard adapts once you tell us what you're after.",
    iconName: "Plus",
  },
];
