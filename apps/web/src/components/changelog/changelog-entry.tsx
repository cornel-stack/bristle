import { ChangelogBadge } from "./changelog-badge";
import { ChangelogFigure } from "./changelog-figure";
import type { ChangelogEntry as ChangelogEntryType } from "./types";

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
}

// 3-column row at md+ per plan §D13. Outer <article> carries
// scroll-mt-section so deep-link permalinks (/changelog#entry-{slug}) land
// below the sticky TopNav. The dual scroll-mt discipline (article level +
// section level) keeps both #month and #entry-slug anchors clean.
export function ChangelogEntry({ entry }: ChangelogEntryProps) {
  return (
    <article
      id={`entry-${entry.slug}`}
      className="scroll-mt-section grid gap-grid md:grid-cols-[6rem_1fr] md:gap-section"
    >
      <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
        {entry.displayDay}
      </p>
      <div className="flex flex-col gap-tight">
        <div className="flex flex-wrap items-baseline gap-tight">
          <h3 className="font-serif text-h3 text-text-primary">
            {entry.title}
          </h3>
          <ChangelogBadge type={entry.type} />
        </div>
        <p className="font-serif text-body-lg text-text-primary">
          {entry.body}
        </p>
        {entry.figure && <ChangelogFigure figure={entry.figure} />}
      </div>
    </article>
  );
}
