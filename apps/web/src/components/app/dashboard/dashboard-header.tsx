// Dashboard greeting (server component). Time-of-day + date are LIVE (server
// clock — A3, not pinned to the design snapshot); the subhead counts come from the
// demo user's usage meters. §4 tokens.
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  name,
  newMentions,
  momentumCrossed,
  watchedCount,
}: {
  name: string;
  newMentions: number;
  momentumCrossed: number;
  watchedCount: number;
}) {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()] ?? "";
  const month = MONTHS[now.getMonth()] ?? "";
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <div className="flex flex-col gap-tight">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
        {weekday} · {month} {now.getDate()} · {hh}:{mm}
      </p>
      <h1 className="font-serif text-h1 font-semibold text-text-primary">
        {greetingFor(now.getHours())}, {name}.
      </h1>
      <p className="text-body-md text-text-secondary">
        <span className="font-medium text-accent-bristle">
          {newMentions} new mentions
        </span>{" "}
        across your {watchedCount} categories since yesterday. {momentumCrossed}{" "}
        problems crossed momentum thresholds.
      </p>
    </div>
  );
}
