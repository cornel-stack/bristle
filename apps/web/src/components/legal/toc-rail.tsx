"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import type { TocItem } from "./types";

// IntersectionObserver config — verbatim from slice-006 FaqScrollSpyRail per
// plan §D6 (the tracked follow-up is to dedupe into a shared
// SectionScrollSpyRail in a future refactor slice).
const ROOT_MARGIN = "-80px 0px -55% 0px";
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

interface TocRailProps {
  items: ReadonlyArray<TocItem>;
  /** Accessible name for the <nav> landmark. Defaults to the slice-006 string. */
  ariaLabel?: string;
}

export function TocRail({
  items,
  ariaLabel = "Sections of the page",
}: TocRailProps) {
  // Seed active with the first section id so the rail has correct visual state
  // before the IntersectionObserver fires (avoids ~16ms initial flicker).
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const visibleSections = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // IntersectionObserver: track every [data-legal-section]; pick the topmost
  // intersecting one and set active to its id. If nothing intersects (visitor
  // between sections), keep previous active — no flicker per plan §D6.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-legal-section]",
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
  // visitor scrolls. Desktop rail is sticky and always visible — no-op there.
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
                    : "block w-full border-l-2 border-transparent py-1 pl-snug text-body-sm text-text-secondary no-underline hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.number}. {item.title}
              </a>
            </li>
          );
        })}
      </ul>

      {/* Mobile horizontal pill row (<md). */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <a
                ref={(el) => {
                  if (el) mobilePillRefs.current.set(item.id, el);
                }}
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, item.id)}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-pill bg-text-primary px-grid py-1.5 text-body-sm font-medium text-surface-card no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-grid py-1.5 text-body-sm text-text-secondary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {item.number}. {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
