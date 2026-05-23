import Link from "next/link";

export function StillStuckCard() {
  return (
    <aside className="rounded-card border border-border-default bg-surface-raised p-card">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
        STILL STUCK?
      </p>
      <p className="mt-tight text-body-md text-text-primary">
        Email gets answered. Promise.
      </p>
      <Link
        href="/contact"
        className="mt-grid inline-flex items-center text-body-sm font-medium text-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        Contact support →
      </Link>
    </aside>
  );
}
