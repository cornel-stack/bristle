"use client";

// ChangelogJumpNav — scroll-spy navigation for the 5 month sections on
// /changelog. FOURTH structural mirror of slice-006 FaqScrollSpyRail,
// slice-009 TocRail, and slice-010 BlogRailToc per plan §D7 — IntersectionObserver
// config + topmost-visible resolution + no-flicker discipline + modifier-key
// passthrough + mobile-pill auto-scroll + reduced-motion fresh-read are
// verbatim from those three precedents.
//
// KEY DIVERGENCE from slices 009/010 (per plan §D7): the click handler
// resolves the target via document.querySelector('[data-changelog-month=...]')
// rather than document.getElementById(monthKey). Slice 011 sections carry
// BOTH id={monthKey} AND data-changelog-month={monthKey}, so either approach
// works — but querying the data attribute keeps the click handler symmetric
// with the IntersectionObserver setup that also reads [data-changelog-month].
// The tracked SectionScrollSpyRail refactor (now spanning 4 mirrors and the
// highest-pressure deferred refactor in the project) needs to pick a canonical
// target-resolution strategy when it lands.
//
// This file MUST NOT import from apps/web/src/components/faq/scroll-spy-rail.tsx,
// apps/web/src/components/legal/toc-rail.tsx, or apps/web/src/components/blog/blog-rail-toc.tsx
// — additive only.

import { type MouseEvent, useEffect, useRef, useState } from "react";

import type { ChangelogJumpItem } from "./types";

const ROOT_MARGIN = "-80px 0px -55% 0px";
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

interface ChangelogJumpNavProps {
  items: ReadonlyArray<ChangelogJumpItem>;
  /** Defaults to the page-scoped label so it doesn't collide with TopNav's primary-nav landmark. */
  ariaLabel?: string;
}

export function ChangelogJumpNav({
  items,
  ariaLabel = "Jump to a month",
}: ChangelogJumpNavProps) {
  // Seed active with the first month so the rail's visual state is correct
  // before the IntersectionObserver fires (anti-flicker per slice-009 plan §D6).
  const [active, setActive] = useState<string>(items[0]?.monthKey ?? "");
  const visibleMonths = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // IntersectionObserver: track every [data-changelog-month]; pick the topmost
  // intersecting one and set active to its monthKey. If nothing intersects
  // (visitor between months), preserve the previous active value — no flicker.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-changelog-month]",
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const monthKey = entry.target.getAttribute("data-changelog-month");
          if (!monthKey) continue;
          if (entry.isIntersecting) {
            visibleMonths.current.set(monthKey, entry.boundingClientRect.top);
          } else {
            visibleMonths.current.delete(monthKey);
          }
        }
        if (visibleMonths.current.size === 0) return;

        let topMonthKey: string | null = null;
        let topY = Infinity;
        for (const [monthKey, y] of visibleMonths.current) {
          if (y < topY) {
            topY = y;
            topMonthKey = monthKey;
          }
        }
        if (topMonthKey) setActive(topMonthKey);
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Mobile pill auto-scroll-into-view: keep the active pill on-screen as the
  // visitor scrolls. Desktop rail is sticky-visible — no-op there.
  useEffect(() => {
    if (window.matchMedia(DESKTOP_MQ).matches) return;
    const pill = mobilePillRefs.current.get(active);
    if (!pill) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    pill.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, monthKey: string) {
    // Let the browser handle modified clicks (Cmd/Ctrl/middle/shift) so they
    // open in a new tab as the href would natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // Plan §D7 divergence: querySelector on data attribute keeps click + IO
    // logic symmetric. Sections also carry id={monthKey}, so getElementById
    // would also work — but the future shared SectionScrollSpyRail refactor
    // needs to commit to one strategy, and IO-symmetric is cleaner.
    const target = document.querySelector<HTMLElement>(
      `[data-changelog-month="${monthKey}"]`,
    );
    if (!target) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <nav aria-label={ariaLabel}>
      {/* Desktop sticky vertical rail (md+). */}
      <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
        {items.map((item) => {
          const isActive = active === item.monthKey;
          return (
            <li key={item.monthKey}>
              <a
                href={`#${item.monthKey}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, item.monthKey)}
                className={
                  isActive
                    ? "block w-full border-l-2 border-accent-bristle py-1 pl-snug text-body-sm font-medium text-text-primary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "block w-full border-l-2 border-transparent py-1 pl-snug text-body-sm text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.displayLabel}
              </a>
            </li>
          );
        })}
      </ul>
      {/* Mobile horizontal pill row (below md). */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {items.map((item) => {
          const isActive = active === item.monthKey;
          return (
            <li key={item.monthKey}>
              <a
                ref={(el) => {
                  if (el) mobilePillRefs.current.set(item.monthKey, el);
                  else mobilePillRefs.current.delete(item.monthKey);
                }}
                href={`#${item.monthKey}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, item.monthKey)}
                className={
                  isActive
                    ? "inline-block whitespace-nowrap rounded-pill bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "inline-block whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.displayLabel}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
