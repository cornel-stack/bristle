// Shared LegalContent + TocItem types for slice-009 legal pages.
//
// LegalContent describes one whole page (Terms / Privacy / Security / GDPR).
// LegalSectionContent.reviewNote is a developer-facing field that NEVER
// renders to the user-visible page (per FR-018 / plan §D7); LegalSection
// reads only `paragraphs`.
//
// TocItem is the minimal projection LegalLayout passes into TocRail so the
// rail's prop surface stays tight (no paragraph prose serialized into client
// hydration).

export interface LegalHeroContent {
  /** Small-caps eyebrow in accent color, e.g. "LEGAL". */
  eyebrow: string;
  /** Page <h1>, rendered serif. */
  headline: string;
  /**
   * Last-updated dates as fixed strings (per clarification (c)). `posted`
   * is required; `effective` is optional and omitted on Security + GDPR
   * per spec §11 + §12 (those pages are continuously-updated practice
   * statements, not contracts).
   */
  lastUpdated: {
    posted: string;
    effective?: string;
  };
}

export interface LegalSectionContent {
  /**
   * kebab-case; serves as both the <section id> anchor target AND the
   * [data-legal-section] marker the TocRail's IntersectionObserver queries.
   */
  id: string;
  /** 1-10; rendered as "{number}. {title}" in the section h2. */
  number: number;
  /** Section title, rendered serif. */
  title: string;
  /** Verbatim paragraphs; rendered as a <p> per entry, in source order. */
  paragraphs: ReadonlyArray<string>;
  /**
   * Optional developer-facing review note flagging a founder/legal sign-off
   * item (e.g. entity name, jurisdiction, payment processor, address, DPO).
   * NEVER rendered to the user-visible page (per FR-018). Surfaces only via
   * source, PR description, and the pre-launch checklist. LegalSection
   * reads only `paragraphs` — it never touches this field.
   */
  reviewNote?: string;
}

export interface LegalContent {
  hero: LegalHeroContent;
  /**
   * Exactly 10 entries per FR-014; rendered in source order, section numbers
   * must match the position (sections[0].number === 1, etc.).
   */
  sections: ReadonlyArray<LegalSectionContent>;
}

/**
 * Minimal projection consumed by TocRail. LegalLayout maps content.sections
 * to TocItem[] before passing into the rail — keeps the rail's prop surface
 * tight and avoids paragraph prose ever being serialized for client hydration.
 */
export interface TocItem {
  id: string;
  number: number;
  title: string;
}
