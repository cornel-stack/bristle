// Source registry — the FIVE live sources rendered across the app. Product Hunt
// and Google Play are intentionally ABSENT (Design-delta, slice 016): no source
// the Tier-5 pipeline can't later fill, so no badge that would go permanently
// empty at the fixtures→live swap. The model is extensible — adding a source
// later is a one-line entry here (+ a BadgeKey + a SOURCE_BADGES slot); no schema
// change. No screen-facing type hardcodes a key — screens import this registry.

export type SourceKey = "gh" | "hn" | "so" | "se" | "appstore" | "forum";

export type BadgeKey =
  | "github"
  | "hackernews"
  | "stackexchange"
  | "appstore"
  | "forums";

export interface SourceMeta {
  key: SourceKey;
  label: string; // human label for the raw key
  badgeKey: BadgeKey; // the rolled-up display badge it renders under
}

// 6 keys → 5 badges. Stack Overflow (`so`) AND the wider Stack Exchange network
// (`se`) both roll under one `stackexchange` badge; Discourse forums under one
// `forums` badge. (FR-022.)
export const SOURCE_REGISTRY: Record<SourceKey, SourceMeta> = {
  gh: { key: "gh", label: "GitHub", badgeKey: "github" },
  hn: { key: "hn", label: "Hacker News", badgeKey: "hackernews" },
  so: { key: "so", label: "Stack Overflow", badgeKey: "stackexchange" },
  se: { key: "se", label: "Stack Exchange", badgeKey: "stackexchange" },
  appstore: { key: "appstore", label: "App Store", badgeKey: "appstore" },
  forum: { key: "forum", label: "Forums", badgeKey: "forums" },
};

// The 5 display badges in facet/legend order — the single source of truth for
// "which source badges exist". Exactly five; no Product Hunt / Google Play.
export const SOURCE_BADGES: readonly { badgeKey: BadgeKey; label: string }[] = [
  { badgeKey: "github", label: "GitHub" },
  { badgeKey: "hackernews", label: "Hacker News" },
  { badgeKey: "stackexchange", label: "Stack Exchange" },
  { badgeKey: "appstore", label: "App Store" },
  { badgeKey: "forums", label: "Forums" },
];

// Validates a raw source key against the registry (the seed calls this at author
// time so no fixture can carry an off-registry — e.g. producthunt — key).
export function isSourceKey(value: string): value is SourceKey {
  return Object.prototype.hasOwnProperty.call(SOURCE_REGISTRY, value);
}

// Resolve a source key to its display badge (SO/SE → stackexchange, forum →
// forums). Throws on an unknown key — keys are registry-validated at seed time.
export function resolveBadge(key: SourceKey): {
  badgeKey: BadgeKey;
  label: string;
} {
  const meta = SOURCE_REGISTRY[key];
  const badge = SOURCE_BADGES.find((b) => b.badgeKey === meta.badgeKey);
  if (!badge) throw new Error(`No display badge for source key "${key}"`);
  return badge;
}
