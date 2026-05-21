// Generic "Y" letterform mark (currentColor); not the Hacker News corporate logo.
export function HackerNewsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7.2 13V8.7L4 3.5h1.7L8 7.3l2.3-3.8H12L8.8 8.7V13z" />
    </svg>
  );
}
