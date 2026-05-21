// Generic "A" letterform mark (currentColor); not the Apple App Store corporate logo.
export function AppStoreIcon({ className }: { className?: string }) {
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
      <path d="M8 3 11.6 13H10l-.66-1.9H6.66L6 13H4.4zm0 3.2-1 2.9h2z" />
    </svg>
  );
}
