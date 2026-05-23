import Link from "next/link";

export function EnterpriseCard() {
  return (
    <section className="mx-auto max-w-5xl px-grid pb-section">
      <div className="rounded-card border border-border-default bg-surface-raised p-card md:flex md:items-start md:justify-between md:gap-card">
        <div className="max-w-2xl">
          <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
            ENTERPRISE
          </p>
          <h2 className="mt-grid font-serif text-h2 text-text-primary">
            Need custom seats, on-prem ingestion, or category requests?
          </h2>
          <p className="mt-grid text-body-md text-text-secondary">
            Talk to us about a private dataset, SLA, and procurement-friendly invoicing.
          </p>
        </div>
        <div className="mt-card md:mt-0 md:shrink-0">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-button border border-text-primary px-grid py-2 text-body-md font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            Contact sales →
          </Link>
        </div>
      </div>
    </section>
  );
}
