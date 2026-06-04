// Collection color-dot classes. The seed stores generic color names
// (red/green/purple/blue); map them to existing design tokens so the dots read
// on-brand within the editorial palette (no arbitrary values, no raw-palette
// dependency — §5 tokens-only).
export const COLLECTION_DOT: Record<string, string> = {
  red: "bg-status-error",
  green: "bg-status-success",
  purple: "bg-category-ai-ml-fg",
  blue: "bg-category-auth-sso-fg",
};

export function dotClass(color: string | null): string {
  return (color && COLLECTION_DOT[color]) || "bg-text-tertiary";
}
