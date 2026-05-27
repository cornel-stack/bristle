import { ChangelogEntry } from "./changelog-entry";
import type { ChangelogMonthGroup } from "./types";

interface ChangelogMonthSectionProps {
  month: ChangelogMonthGroup;
}

// Per plan §D13: id={monthKey} for native anchor links + data-changelog-month
// for ChangelogJumpNav's IntersectionObserver selector + scroll-mt-section
// for the dual-offset discipline so #month-anchors land below TopNav. The
// "Current" pill renders conditionally — exactly one month group across the
// page has isCurrent === true (the one containing max(entry.date)).
export function ChangelogMonthSection({ month }: ChangelogMonthSectionProps) {
  return (
    <section
      id={month.monthKey}
      data-changelog-month={month.monthKey}
      className="scroll-mt-section flex flex-col gap-section"
    >
      <div className="flex items-baseline gap-snug">
        <h2 className="font-serif text-h2 text-text-primary">
          {month.monthLabel}
        </h2>
        {month.isCurrent && (
          <span className="rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium text-text-secondary">
            Current
          </span>
        )}
      </div>
      <div className="flex flex-col gap-loose">
        {month.entries.map((entry) => (
          <ChangelogEntry key={entry.slug} entry={entry} />
        ))}
      </div>
    </section>
  );
}
