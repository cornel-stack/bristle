"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { FAQ_ITEMS } from "./faq-data";

const SECTIONS = [
  { id: "pricing",      label: "Pricing" },
  { id: "data-sources", label: "Data sources" },
  { id: "privacy",      label: "Privacy" },
  { id: "cancellation", label: "Cancellation" },
  { id: "api",          label: "API" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

// First FAQ item id per section, derived from faq-data so the rail anchors stay
// in sync if questions are reordered.
const FIRST_ITEM_ID_BY_SECTION: Record<SectionId, string> = SECTIONS.reduce(
  (acc, section) => {
    const first = FAQ_ITEMS.find((item) => item.section === section.id);
    acc[section.id] = first?.id ?? "";
    return acc;
  },
  {} as Record<SectionId, string>,
);

export function FaqScrollSpyRail() {
  // Initial active matches the default-open accordion item (faq-q-1 → data-sources).
  const [active, setActive] = useState<SectionId>("data-sources");
  const visibleItems = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<SectionId, HTMLAnchorElement>>(new Map());

  // IntersectionObserver: track every [data-faq-item]; pick the topmost intersecting
  // one and set active to its data-section. If nothing intersects, keep previous active
  // (no flicker between sections per the spec edge case).
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-faq-item]");
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleItems.current.set(id, entry.boundingClientRect.top);
          } else {
            visibleItems.current.delete(id);
          }
        }
        if (visibleItems.current.size === 0) return;

        let topId: string | null = null;
        let topY = Infinity;
        for (const [id, y] of visibleItems.current) {
          if (y < topY) {
            topY = y;
            topId = id;
          }
        }
        if (!topId) return;
        const section = document.getElementById(topId)?.dataset.section as
          | SectionId
          | undefined;
        if (section) setActive(section);
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll the active mobile pill into view so the visitor always sees which
  // section they're in. Desktop rail is sticky and always visible — no-op there.
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

  function handleClick(e: MouseEvent<HTMLAnchorElement>, sectionId: SectionId) {
    // Let the browser handle modified clicks (Cmd/Ctrl/middle/shift) so they
    // open in a new tab as the href would natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const targetId = FIRST_ITEM_ID_BY_SECTION[sectionId];
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav aria-label="FAQ sections">
      {/* Desktop sticky vertical rail (md+). */}
      <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${FIRST_ITEM_ID_BY_SECTION[section.id]}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, section.id)}
                className={
                  isActive
                    ? "block w-full border-l-2 border-accent-bristle py-1 pl-snug text-body-sm font-medium text-text-primary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "block w-full border-l-2 border-transparent py-1 pl-snug text-body-sm text-text-secondary no-underline hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>

      {/* Mobile horizontal pill row (<md). */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id} className="shrink-0">
              <a
                ref={(el) => {
                  if (el) mobilePillRefs.current.set(section.id, el);
                }}
                href={`#${FIRST_ITEM_ID_BY_SECTION[section.id]}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => handleClick(e, section.id)}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-pill bg-text-primary px-grid py-1.5 text-body-sm font-medium text-surface-card no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-grid py-1.5 text-body-sm text-text-secondary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
