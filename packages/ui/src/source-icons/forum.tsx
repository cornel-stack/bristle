// Generic "discussion / forum" speech-bubble mark (currentColor) — for developer
// community forums (Discourse). Abstract, like the other source marks (not a
// corporate logo). Slice 4.2 (D6): the 4.1 source model's `forum` had no card mark.
export function ForumIcon({ className }: { className?: string }) {
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
      <path d="M3 3.5h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7.6L4.4 13v-2.5H3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
