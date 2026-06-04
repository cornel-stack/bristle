// Compact "X ago" formatter (m / h / d / w), computed from the current clock.
// NOTE: the dashboard's seeded timestamps are FIXED dates (anchored to the design's
// "today", 2026-05-12), so as real time passes these drift away from the design's
// fresh "12m ago / 1h ago" look — see TF-023 (seed timestamps relative to now).
export function relativeTime(date: Date): string {
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
