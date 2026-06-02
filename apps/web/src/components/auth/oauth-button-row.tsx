// OAuth provider button row for the signup + login pages (server component —
// the providers are plain <a> links to Auth.js's signin endpoints, no client JS).
//
// Hrefs target /api/auth/signin/{provider}; the optional `callbackPath` appends
// ?callbackUrl=… (Batch B / T018 passes "/auth/callback/{provider}"). The Auth.js
// handlers exist from slice 013, but the providers array is still [] until Batch
// B (T015), so these links 404 if clicked before then — expected: A1 ships the
// markup, B wires the destinations.
//
// Logos are inline SVG (no network fetch on a sign-in page). The Google mark
// keeps its four OFFICIAL brand hex values — a deliberate, documented exception
// to the tokens-only rule (a third-party trademark cannot be re-themed). The
// GitHub mark is monochrome via currentColor, so it stays token-driven.
// The SSO button is visibly disabled with a tooltip (spec FR-019); it never
// navigates.

import { KeyRound } from "lucide-react";

const BUTTON_CLASS =
  "flex flex-1 items-center justify-center gap-tight rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-sm font-medium text-text-primary hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

// Each provider's signin links through to its own progress page
// (/auth/callback/{provider}) so Auth.js redirects there after creating the
// session; that page short-circuits to /account once the session is readable
// (Option B — see plan R7/D6).
function signinHref(provider: "google" | "github"): string {
  const callbackUrl = encodeURIComponent(`/auth/callback/${provider}`);
  return `/api/auth/signin/${provider}?callbackUrl=${callbackUrl}`;
}

export function OAuthButtonRow() {
  return (
    <div className="flex gap-snug">
      <a href={signinHref("google")} className={BUTTON_CLASS}>
        <GoogleMark />
        Google
      </a>
      <a href={signinHref("github")} className={BUTTON_CLASS}>
        <GitHubMark />
        GitHub
      </a>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Coming soon — SSO available on Enterprise"
        className={`${BUTTON_CLASS} cursor-not-allowed text-text-tertiary hover:bg-surface-card`}
      >
        <KeyRound className="size-4" strokeWidth={1.5} aria-hidden="true" />
        SSO
      </button>
    </div>
  );
}
