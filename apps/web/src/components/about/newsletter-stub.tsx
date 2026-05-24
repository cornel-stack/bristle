// About-page newsletter stub. SEPARATE component from the slice-005 footer
// stub per clarification (e) — distinct styling (full-card with surface-raised
// background vs. footer's inline-row treatment), and slice 2.7 may wire the
// two differently when newsletter goes live. Both stubs render disabled
// controls and the "Subscriptions open in v0.2.7." caption.

export function NewsletterStub() {
  return (
    <section className="mx-auto max-w-3xl px-grid pb-section">
      <div className="rounded-card border border-border-default bg-surface-raised p-card">
        <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
          FIELD NOTES — MONTHLY
        </p>
        <h2 className="mt-grid font-serif text-h2 text-text-primary">
          Get one new problem report each month.
        </h2>
        <form
          className="mt-grid flex flex-col gap-tight sm:flex-row sm:items-center"
          aria-describedby="newsletter-stub-caption"
        >
          <label htmlFor="newsletter-stub-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-stub-email"
            type="email"
            placeholder="you@domain.com"
            disabled
            className="flex-1 rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled
            className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            Subscribe
          </button>
        </form>
        <p
          id="newsletter-stub-caption"
          className="mt-tight text-body-sm text-text-secondary"
        >
          Subscriptions open in v0.2.7.
        </p>
      </div>
    </section>
  );
}
