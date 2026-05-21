// Dispatch + barrel for the source-platform marks. Server component; the icon
// inherits color via `currentColor`. The visible meaning is carried by the
// parent badge's aria-label, so each mark is aria-hidden.
import { GithubIcon } from "./github";
import { HackerNewsIcon } from "./hacker-news";
import { StackOverflowIcon } from "./stack-overflow";
import { ProductHuntIcon } from "./product-hunt";
import { AppStoreIcon } from "./app-store";
import { GooglePlayIcon } from "./google-play";

export { GithubIcon, HackerNewsIcon, StackOverflowIcon, ProductHuntIcon, AppStoreIcon, GooglePlayIcon };

export type SourceKey = "gh" | "hn" | "so" | "ph" | "ap" | "gp";

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const ICONS: Record<SourceKey, IconComponent> = {
  gh: GithubIcon,
  hn: HackerNewsIcon,
  so: StackOverflowIcon,
  ph: ProductHuntIcon,
  ap: AppStoreIcon,
  gp: GooglePlayIcon,
};

export const SOURCE_LABELS: Record<SourceKey, string> = {
  gh: "GitHub",
  hn: "Hacker News",
  so: "Stack Overflow",
  ph: "Product Hunt",
  ap: "Apple App Store",
  gp: "Google Play",
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
