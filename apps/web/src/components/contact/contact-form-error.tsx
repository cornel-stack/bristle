// Server component rendered by ContactForm above the form when the action
// returns { status: "transport-error" }. The banner div carries
// data-form-state="transport-error" so the form's focus useEffect can locate
// it via document.querySelector after the error state renders (decision §7).
//
// Visible for both the "not-configured" and the "transport" Resend failure
// modes — the visitor sees one banner regardless of root cause per spec edge
// case + plan decision §3.

export function ContactFormError() {
  return (
    <div
      data-form-state="transport-error"
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      className="rounded-card border border-status-error bg-surface-raised p-card outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
    >
      <p className="text-body-md text-text-primary">
        Could not send right now. Email us directly at{" "}
        <a
          href="mailto:support@bristle.dev"
          className="text-accent-bristle underline decoration-from-font underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          support@bristle.dev
        </a>{" "}
        and we&apos;ll respond from there.
      </p>
    </div>
  );
}
