// Horizontal rule with centered "OR EMAIL" between the OAuth button row and the
// email field (server component). Mono caps in muted text; the rules use the
// standard border token. Vertical rhythm is owned by the parent form's gap.

export function OrEmailDivider() {
  return (
    <div
      className="flex items-center gap-snug"
      role="separator"
      aria-label="or continue with email"
    >
      <span className="h-px flex-1 bg-border-default" aria-hidden="true" />
      <span className="font-mono text-mono-sm uppercase tracking-wide text-text-tertiary">
        OR EMAIL
      </span>
      <span className="h-px flex-1 bg-border-default" aria-hidden="true" />
    </div>
  );
}
