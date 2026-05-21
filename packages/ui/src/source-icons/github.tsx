// Generic "branch" mark (currentColor); not the GitHub corporate logo.
export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="4" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="11" cy="6" r="1.6" />
      <path d="M5 5.6v4.8" />
      <path d="M11 7.6c0 2-1.6 2.8-3.4 3" />
    </svg>
  );
}
