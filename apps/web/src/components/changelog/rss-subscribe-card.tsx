export function RssSubscribeCard() {
  return (
    <aside className="flex flex-col gap-tight rounded-card border border-border-default p-card">
      <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
        RSS · ATOM
      </p>
      <p className="text-body-sm text-text-secondary">
        Subscribe to{" "}
        <a
          href="/changelog.atom"
          className="text-text-primary underline hover:text-accent-bristle"
        >
          /changelog.atom
        </a>{" "}
        from anywhere.
      </p>
    </aside>
  );
}
