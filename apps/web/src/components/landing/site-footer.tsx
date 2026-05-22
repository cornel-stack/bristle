const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Sample reports", href: "/#sample" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API", href: "/api" },
      { label: "Help center", href: "/help" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Security", href: "/security" },
      { label: "GDPR", href: "/gdpr" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border-default bg-surface-card">
      <div className="mx-auto max-w-6xl px-grid py-section">
        <div className="grid gap-loose md:grid-cols-2 lg:grid-cols-3">
          {/* Brand + tagline + newsletter stub */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-snug">
              <span className="size-3 rotate-45 bg-accent-bristle" aria-hidden="true" />
              <span className="font-serif text-h4 font-semibold text-text-primary">Bristle</span>
            </div>
            <p className="mt-snug max-w-xs text-body-sm text-text-secondary">
              Multi-source problem discovery for builders. Made for indie founders, by indie founders.
            </p>
            <form className="mt-grid flex max-w-sm gap-snug">
              <input
                type="email"
                placeholder="you@domain.com"
                disabled
                aria-label="Email address"
                aria-describedby="newsletter-note"
                className="min-w-0 flex-1 rounded-button border border-border-default bg-surface-canvas px-snug py-2 text-body-sm text-text-primary disabled:opacity-60"
              />
              <button
                type="button"
                disabled
                className="rounded-button bg-accent-bristle px-snug py-2 text-body-sm font-medium text-surface-card disabled:opacity-60"
              >
                Subscribe
              </button>
            </form>
            <p id="newsletter-note" className="mt-snug text-body-sm text-text-tertiary">
              Email subscriptions launching soon
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-grid sm:grid-cols-4 lg:col-span-2">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <p className="text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
                  {column.heading}
                </p>
                <ul className="mt-snug flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-body-sm text-text-secondary hover:text-text-primary">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-section flex flex-wrap items-center justify-between gap-snug border-t border-border-default pt-grid text-body-sm text-text-tertiary">
          <span>© 2026 Bristle Research, Inc.</span>
          <span className="font-mono text-mono-sm">v0.2.0 · status: operational</span>
        </div>
      </div>
    </footer>
  );
}
