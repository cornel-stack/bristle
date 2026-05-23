import Link from "next/link";

export function FaqBottomCta() {
  return (
    <section className="mx-auto max-w-5xl px-grid pb-section">
      <div className="rounded-card border border-border-default bg-surface-card p-card text-center">
        <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
          STILL DIDN&apos;T FIND IT?
        </p>
        <h2 className="mt-grid font-serif text-h2 text-text-primary">
          Email a human at{" "}
          <a
            href="mailto:support@bristle.dev"
            className="text-accent-bristle underline decoration-from-font underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            support@bristle.dev
          </a>
          .
        </h2>
        <p className="mt-grid text-body-md text-text-secondary">
          We respond within one business day.
        </p>
        <div className="mt-card">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-button border border-text-primary px-grid py-2 text-body-md font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            Open a ticket →
          </Link>
        </div>
      </div>
    </section>
  );
}
