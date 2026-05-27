// Shared ChangelogEntry + month group + jump item shapes for slice-011
// Changelog + Atom feed.
//
// CHANGELOG_ENTRIES (at changelog-entries.ts) exports the canonical data
// store consumed by BOTH /changelog (page) and /changelog.atom (feed).
// ChangelogLayout groups entries by monthKey + computes the "current"
// month flag, then projects to ChangelogJumpItem[] for the rail.
//
// Naming divergence (intentional — do not "fix"): ChangelogJumpItem uses
// `displayLabel` while ChangelogEntry uses `monthLabel`. The rail item is
// a deliberately distinct projection (Pick-style boundary per slice-010
// BlogTocItem precedent + plan §D3); `displayLabel` makes it clearer at
// the rail call site that this is the render string, not the entry-source
// monthLabel field. The projection happens in ChangelogLayout via
// `months.map(m => ({ monthKey: m.monthKey, displayLabel: m.monthLabel }))`.
//
// ChangelogFigureContent is forward-compatible — a future content slice
// can add `src?: string` (and optionally `width?` / `height?`) to carry
// real screenshot URLs without changing any consumer. NOT used this slice;
// only the May 8 entry's diagonal-stripes SVG placeholder uses `caption`.

export type ChangelogType = "feature" | "improvement" | "fix";

export interface ChangelogFigureContent {
  /**
   * Visible caption rendered inside the figure placeholder, e.g.
   * "compare view". The full placeholder text reads
   * `screenshot · {caption} · 1280×720` (per plan §D9 / ChangelogFigure).
   *
   * Forward-compatible: a future content slice can add `src?: string` to
   * carry real screenshot URLs without changing consumers. NOT used this
   * slice.
   */
  caption: string;
}

export interface ChangelogEntry {
  /**
   * kebab-case; serves as the <article id="entry-{slug}"> anchor target on
   * the page AND the per-entry Atom <id> permalink fragment
   * (`${SITE_URL}/changelog#entry-${slug}`).
   */
  slug: string;
  /** ISO yyyy-mm-dd; used for sorting + Atom <updated> RFC 3339 derivation. */
  date: string;
  /**
   * Pre-formatted display string, e.g. "MAY 8" / "APR 22". Per
   * clarification (g) carried from slice 010 — fixed compile-time strings
   * to avoid runtime Intl.DateTimeFormat (no locale drift between SSR and
   * hydration). Convention: uppercase 3-letter month abbreviation + space
   * + day-of-month with no leading zero.
   */
  displayDay: string;
  /**
   * kebab-case month identifier, e.g. "may-2026". Used by ChangelogJumpNav's
   * IntersectionObserver via the [data-changelog-month] attribute AND as the
   * <section id={monthKey}> for native anchor-link behavior.
   */
  monthKey: string;
  /**
   * e.g. "May 2026". Rendered in ChangelogMonthSection's <h2> AND projected
   * to ChangelogJumpItem.displayLabel for the rail.
   */
  monthLabel: string;
  title: string;
  type: ChangelogType;
  /**
   * Single paragraph. Rendered as <p> in the entry body on the page AND as
   * <summary type="text"> in the Atom feed (passed through escapeXml at the
   * Atom-template boundary).
   */
  body: string;
  /**
   * Optional placeholder figure. Only set on entries that ship with a
   * figure this slice (the May 8 entry only). Other entries omit this field.
   */
  figure?: ChangelogFigureContent;
}

export interface ChangelogMonthGroup {
  /** Same value as the entries' shared monthKey. */
  monthKey: string;
  /** Same value as the entries' shared monthLabel. */
  monthLabel: string;
  /**
   * Entries belonging to this month, in source order (most-recent first
   * within the month).
   */
  entries: ReadonlyArray<ChangelogEntry>;
  /**
   * True for exactly one group across all months — the one containing the
   * entry with `max(entry.date)`. Computed at build time by ChangelogLayout
   * (plan §D4 step 3) via `entries.reduce((max, e) => e.date > max.date ?
   * e : max).monthKey`. No runtime Date.now().
   */
  isCurrent: boolean;
}

export interface ChangelogJumpItem {
  /** kebab-case; matches ChangelogEntry.monthKey AND <section id>. */
  monthKey: string;
  /**
   * Render string shown in the rail (e.g. "May 2026"). DELIBERATELY named
   * `displayLabel` (not `monthLabel`) — see file-level TSDoc above for
   * rationale. The projection happens in ChangelogLayout; the rail consumes
   * this minimal {monthKey, displayLabel} shape to keep paragraph prose +
   * figure data out of the client hydration payload.
   */
  displayLabel: string;
}
