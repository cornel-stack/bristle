import { ProblemCardFull, type ProblemCardFullProps } from "@bristle/ui";
import { ThemeShowcase } from "./theme-showcase";

// Server-rendered fixtures for the design-system showcase. Cards are rendered
// here (server) and passed as children to the client ThemeShowcase, so they
// stay Server Components while only the toggle is client.
const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

const cards: ProblemCardFullProps[] = [
  {
    title: "Stripe webhooks fail silently on Vercel cold starts",
    category: "Payments",
    categoryColor: "payments",
    momentum: 312,
    sparkline: [4, 5, 5, 6, 7, 6, 8, 9, 8, 11, 12, 14, 16, 19],
    topQuote:
      "Retries were dropped during cold starts and we lost reconciled revenue for two days before noticing.",
    quoteSource: "gh",
    sources: ["gh", "hn", "so"],
    lastSeenIso: hoursAgo(1),
  },
  {
    title: "LLM streaming chokes through CDN buffering",
    category: "AI / ML",
    categoryColor: "ai-ml",
    momentum: 184,
    sparkline: [9, 8, 9, 10, 9, 11, 10, 12, 11, 13, 12, 14, 15, 17],
    topQuote:
      "Token streaming stalls behind the CDN buffer, so responses arrive in bursts instead of smoothly.",
    quoteSource: "hn",
    sources: ["hn", "so"],
    lastSeenIso: hoursAgo(3),
  },
];

export default function Home() {
  return (
    <ThemeShowcase>
      {cards.map((card) => (
        <ProblemCardFull key={card.title} {...card} />
      ))}
    </ThemeShowcase>
  );
}
