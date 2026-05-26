"use client";

// BlogRailToc — scroll-spy navigation for the featured article's 4 sections.
// THIRD structural mirror of slice-006 FaqScrollSpyRail and slice-009 TocRail
// per plan §D6 — IntersectionObserver config + topmost-visible resolution +
// no-flicker discipline + modifier-key passthrough + mobile-pill auto-scroll
// + reduced-motion fresh-read are verbatim from those two precedents.
//
// The tracked follow-up (now absorbing three mirrors) is to extract a shared
// SectionScrollSpyRail in a future refactor slice; explicitly out of scope
// this slice. This file MUST NOT import from
// apps/web/src/components/faq/scroll-spy-rail.tsx or
// apps/web/src/components/legal/toc-rail.tsx — additive only.
//
// Empty-items check (stub-body articles → items.length === 0) lives at the
// call site in BlogPostLayout, NOT inside this component (avoids React
// rules-of-hooks edge case with early return before useState).

import { type MouseEvent, useEffect, useRef, useState } from "react";

import type { BlogTocItem } from "./types";

const ROOT_MARGIN = "-80px 0px -55% 0px";
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

interface BlogRailTocProps {
  items: ReadonlyArray<BlogTocItem>;
  /** Defaults to the article-scoped label so it doesn't collide with TopNav's primary-nav landmark. */
  ariaLabel?: string;
}

export function BlogRailToc({
  items,
  ariaLabel = "Sections of the article",
}: BlogRailTocProps) {
  // Seed active with the first section id so the rail's visual state is correct
  // before the IntersectionObserver fires (anti-flicker per slice-009 plan §D6).
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const visibleSections = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // IntersectionObserver: track every [data-blog-section]; pick the topmost
  // intersecting one and set active to its id. If nothing intersects (visitor
  // between sections), preserve the previous active value — no flicker.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-blog-section]",
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleSections.current.set(id, entry.boundingClientRect.top);
          } else {
            visibleSections.current.delete(id);
          }
        }
        if (visibleSections.current.size === 0) return;

        let topId: string | null = null;
        let topY = Infinity;
        for (const [id, y] of visibleSections.current) {
          if (y < topY) {
            topY = y;
            topId = id;
          }
        }
        if (topId) setActive(topId);
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

  function handleClick(e: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    // Let the browser handle modified clicks (Cmd/Ctrl/middle/shift) so they
    // open in a new tab as the href would natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const target = document.getElementById(sectionId);
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
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, item.id)}
                className={
                  isActive
                    ? "block w-full border-l-2 border-accent-bristle py-1 pl-snug text-body-sm font-medium text-text-primary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "block w-full border-l-2 border-transparent py-1 pl-snug text-body-sm text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.displayTitle}
              </a>
            </li>
          );
        })}
      </ul>
      {/* Mobile horizontal pill row (below md). */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                ref={(el) => {
                  if (el) mobilePillRefs.current.set(item.id, el);
                  else mobilePillRefs.current.delete(item.id);
                }}
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, item.id)}
                className={
                  isActive
                    ? "inline-block whitespace-nowrap rounded-pill bg-text-primary px-snug py-1 text-body-sm font-medium text-surface-card no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "inline-block whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.displayTitle}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
