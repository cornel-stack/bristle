"use client";

import { useEffect, useRef, useState } from "react";

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

export function FaqScrollSpyRail() {
  // Initial active matches the default-open accordion item (faq-q-1 → data-sources).
  const [active, setActive] = useState<SectionId>("data-sources");
  const visibleItems = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<SectionId, HTMLButtonElement>>(new Map());

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

  function handleJump(sectionId: SectionId) {
    const target = document.querySelector<HTMLElement>(
      `[data-faq-item][data-section="${sectionId}"]`,
    );
    if (!target) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav aria-label="FAQ sections">
      {/* Desktop sticky vertical rail (md+). */}
      <ul
        role="tablist"
        aria-orientation="vertical"
        className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight"
      >
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleJump(section.id)}
                className={
                  isActive
                    ? "w-full border-l-2 border-accent-bristle py-1 pl-snug text-left text-body-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "w-full border-l-2 border-transparent py-1 pl-snug text-left text-body-sm text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Mobile horizontal pill row (<md). */}
      <ul
        role="tablist"
        aria-orientation="horizontal"
        className="flex gap-tight overflow-x-auto pb-2 md:hidden"
      >
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id} className="shrink-0">
              <button
                ref={(el) => {
                  if (el) mobilePillRefs.current.set(section.id, el);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleJump(section.id)}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-pill bg-text-primary px-grid py-1.5 text-body-sm font-medium text-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                    : "whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-grid py-1.5 text-body-sm text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                }
              >
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
