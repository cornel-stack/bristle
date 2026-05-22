// Shared placeholder for routes whose real page ships in a later slice.
// Server component, design-system tokens only, no hardcoded colors or fonts.
export function ComingSoon({ version }: { version: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-grid text-center">
      <div className="flex items-center gap-snug">
        <span className="size-3 rotate-45 bg-accent-bristle" aria-hidden="true" />
        <span className="font-serif text-h4 font-semibold text-text-primary">Bristle</span>
      </div>
      <h1 className="mt-grid font-serif text-h1 text-text-primary">
        Coming in v{version}
      </h1>
      <p className="mt-snug text-body-md text-text-secondary">
        This page is on its way. Check back soon.
      </p>
      <a
        href="/"
        className="mt-loose rounded-button border border-border-default px-snug py-2 text-body-sm font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bristle"
      >
        Back to home
      </a>
    </main>
  );
}
