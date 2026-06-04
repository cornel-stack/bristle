// Dispatch + barrel for the source-platform marks. Server component; the icon
// inherits color via `currentColor`. The visible meaning is carried by the
// parent badge's aria-label, so each mark is aria-hidden.
import { GithubIcon } from "./github";
import { HackerNewsIcon } from "./hacker-news";
import { StackOverflowIcon } from "./stack-overflow";
import { ProductHuntIcon } from "./product-hunt";
import { AppStoreIcon } from "./app-store";
import { GooglePlayIcon } from "./google-play";
import { ForumIcon } from "./forum";

export { GithubIcon, HackerNewsIcon, StackOverflowIcon, ProductHuntIcon, AppStoreIcon, GooglePlayIcon, ForumIcon };

// `forum` added in slice 4.2 (the 4.1 registry's 5th live source). `ph`/`gp` are
// vestigial (the 4.1 model dropped Product Hunt / Google Play) but kept INERT — the
// Tier-2 landing card may still reference them, and the 4.x adapter never feeds
// them. Full reconciliation (drop ph/gp; route badge rendering through the registry
// resolveBadge) is deferred — TF-022.
export type SourceKey = "gh" | "hn" | "so" | "ph" | "ap" | "gp" | "forum";

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const ICONS: Record<SourceKey, IconComponent> = {
  gh: GithubIcon,
  hn: HackerNewsIcon,
  so: StackOverflowIcon,
  ph: ProductHuntIcon,
  ap: AppStoreIcon,
  gp: GooglePlayIcon,
  forum: ForumIcon,
};

export const SOURCE_LABELS: Record<SourceKey, string> = {
  gh: "GitHub",
  hn: "Hacker News",
  so: "Stack Overflow",
  ph: "Product Hunt",
  ap: "Apple App Store",
  gp: "Google Play",
  forum: "Forums",
};

export function SourceIcon({ source, className }: { source: SourceKey; className?: string }) {
  const Icon = ICONS[source];
  // Neutral fallback for an unknown key (cannot occur via the type, but guards
  // runtime data): render a small dot rather than nothing.
  if (!Icon) {
    return (
      <svg
        className={className}
        viewBox="0 0 16 16"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="3" />
      </svg>
    );
  }
  return <Icon className={className} />;
}
