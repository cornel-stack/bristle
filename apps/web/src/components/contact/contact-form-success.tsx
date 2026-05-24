// Server component rendered by ContactForm when the action returns
// { status: "success" }. The h2 carries data-form-state="success" so the
// form's focus useEffect can locate it via document.querySelector after
// the success state replaces the form (decision §7).

export function ContactFormSuccess() {
  return (
    <div className="rounded-card border border-border-default bg-surface-card p-card">
      <h2
        data-form-state="success"
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="font-serif text-h2 text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        Message sent.
      </h2>
      <p className="mt-grid font-serif text-body-lg text-text-secondary">
        We&apos;ll be in touch within one business day. — Cornel
      </p>
    </div>
  );
}
