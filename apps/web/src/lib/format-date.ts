// Deterministic long-date formatter (e.g. "May 30, 2026"). Uses a fixed month
// table + UTC accessors — NOT Intl.DateTimeFormat — to avoid locale/timezone
// drift between server render and any hydration (slice-010 fixed-date precedent,
// applied to a live DB Date rather than a pre-baked string).

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatLongDate(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}
