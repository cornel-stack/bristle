import Link from "next/link";

const NAV_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "About", href: "/about" },
];

export function TopNav() {
  return (
    <header className="border-b border-border-default">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-snug px-grid py-grid">
        <Link href="/" className="flex items-center gap-snug">
          <span className="size-3 rotate-45 bg-accent-bristle" aria-hidden="true" />
          <span className="font-serif text-h4 font-semibold text-text-primary">Bristle</span>
        </Link>
        <div className="flex flex-wrap items-center gap-loose text-body-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-text-secondary hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-snug text-body-sm">
          <Link href="/login" className="text-text-secondary hover:text-text-primary">Sign in</Link>
          <Link href="/signup" className="rounded-button bg-accent-bristle px-snug py-2 font-medium text-surface-card">
            Start free →
          </Link>
        </div>
      </nav>
    </header>
  );
}
