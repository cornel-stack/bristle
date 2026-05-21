// Generic "stacked layers" mark (currentColor); not the Stack Overflow corporate logo.
export function StackOverflowIcon({ className }: { className?: string }) {
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
      <rect x="5" y="9.5" width="6" height="1.4" rx="0.4" />
      <rect x="5.2" y="7" width="5.8" height="1.4" rx="0.4" transform="rotate(-12 8 7.7)" />
      <rect x="5.6" y="4.6" width="5.4" height="1.4" rx="0.4" transform="rotate(-26 8 5.3)" />
      <path d="M4 11.5h8V13H4z" />
    </svg>
  );
}
