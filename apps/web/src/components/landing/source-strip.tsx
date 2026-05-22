import { SourceIcon, SOURCE_LABELS, type SourceKey } from "@bristle/ui";

const SOURCES: SourceKey[] = ["gh", "hn", "so", "ph", "ap", "gp"];

export function SourceStrip() {
  return (
    <section className="bg-surface-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-grid px-grid py-grid md:flex-row md:items-center md:justify-between">
        <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
          Evidence from where builders actually complain
        </p>
        <ul className="flex flex-wrap items-center gap-loose">
          {SOURCES.map((source) => (
            <li key={source} className="flex items-center gap-2 text-body-sm text-text-secondary">
              <SourceIcon source={source} className="size-5" />
              {SOURCE_LABELS[source]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
