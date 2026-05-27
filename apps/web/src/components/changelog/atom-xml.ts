// Hand-rolled Atom 1.0 feed builder for /changelog.atom (the first XML/feed
// surface in the codebase). Zero new top-level dependencies — template
// strings + an explicit escapeXml() helper per plan §D5 + §D6.
//
// Atom 1.0 spec: RFC 4287 (https://datatracker.ietf.org/doc/html/rfc4287).
// Output validated at gate time via element-presence greps + `xmllint
// --noout` parse-check.

import type { ChangelogEntry } from "./types";

/**
 * Escape the five XML predefined entities per RFC 4287 / XML 1.0 §2.4.
 *
 * ORDER MATTERS — `&` MUST be replaced FIRST, otherwise the subsequent
 * `&lt;` / `&gt;` / `&quot;` / `&apos;` substitutions would introduce
 * `&` characters that get re-escaped to `&amp;lt;` etc., corrupting the
 * output. The five `.replace()` calls below are in the only correct order.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a valid Atom 1.0 feed body from CHANGELOG_ENTRIES + SITE_URL.
 *
 * Feed-level elements (8): `<id>`, `<title>`, `<subtitle>`, `<updated>`,
 * `<link rel="self">`, `<link rel="alternate" type="text/html">`,
 * `<author>`, `<generator>`.
 *
 * Per-entry elements (7): `<id>`, `<title>`, `<updated>`, `<link
 * rel="alternate">`, `<summary type="text">`, `<category>`, `<author>`.
 *
 * Entry `<updated>` uses **12:00:00Z (midday UTC)** as the stable
 * convention: the data store carries date-only precision (yyyy-mm-dd),
 * and midday UTC is the most timezone-fair point of the day (within ±12
 * hours of every timezone's local "that day", so entries don't drift to
 * "yesterday" or "tomorrow" anywhere on Earth).
 *
 * All entry-derived strings (title, body, slug, type) pass through
 * `escapeXml()` for defense-in-depth — slugs are kebab-case-safe by
 * construction, but the consistent escape application keeps the template
 * audit-friendly.
 */
export function buildAtomFeed(
  entries: ReadonlyArray<ChangelogEntry>,
  siteUrl: string,
): string {
  const feedId = `${siteUrl}/changelog`;
  const feedSelfHref = `${siteUrl}/changelog.atom`;
  const feedHtmlHref = `${siteUrl}/changelog`;
  const maxDate = entries.reduce((max, e) => (e.date > max.date ? e : max)).date;
  const feedUpdated = `${maxDate}T12:00:00Z`;

  const entryXml = entries
    .map((entry) => {
      const entryId = `${siteUrl}/changelog#entry-${entry.slug}`;
      const entryUpdated = `${entry.date}T12:00:00Z`;
      return `  <entry>
    <id>${escapeXml(entryId)}</id>
    <title>${escapeXml(entry.title)}</title>
    <updated>${entryUpdated}</updated>
    <link rel="alternate" type="text/html" href="${escapeXml(entryId)}"/>
    <summary type="text">${escapeXml(entry.body)}</summary>
    <category term="${escapeXml(entry.type)}"/>
    <author><name>Bristle</name></author>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(feedId)}</id>
  <title>Bristle Changelog</title>
  <subtitle>Public, dated, attributable. The shape of our pace.</subtitle>
  <updated>${feedUpdated}</updated>
  <link rel="self" type="application/atom+xml" href="${escapeXml(feedSelfHref)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(feedHtmlHref)}"/>
  <author><name>Bristle</name></author>
  <generator uri="https://bristle.dev">Bristle hand-rolled</generator>
${entryXml}
</feed>
`;
}
