// Generic "play triangle" mark (currentColor); not the Google Play corporate logo.
export function GooglePlayIcon({ className }: { className?: string }) {
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
      <path d="M4.5 3.2 12 8l-7.5 4.8z" />
    </svg>
  );
}
