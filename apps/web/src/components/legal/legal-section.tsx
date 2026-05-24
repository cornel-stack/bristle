// FR-018 discipline: this component takes the full LegalSectionContent (so the
// content data files can stay typed as a single shape) but renders ONLY
// `paragraphs`. The `reviewNote` field never enters the JSX tree — it lives
// in TypeScript source as a developer-facing field and surfaces only via PR
// description / pre-launch checklist. Verifiable by grep: this file must
// contain zero references to `reviewNote`.

import type { LegalSectionContent } from "./types";

export function LegalSection({ section }: { section: LegalSectionContent }) {
  return (
    <section
      id={section.id}
      data-legal-section={section.id}
      className="scroll-mt-section"
    >
      <h2 className="font-serif text-h2 text-text-primary">
        {section.number}. {section.title}
      </h2>
      <div className="mt-grid space-y-grid">
        {section.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="font-serif text-body-lg text-text-primary"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
