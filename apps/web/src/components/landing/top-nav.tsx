import Link from "next/link";

import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/actions";

const NAV_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "About", href: "/about" },
];

// Truncate a long email for the nav affordance (C-e: name if set, else email).
function truncateEmail(email: string): string {
  return email.length > 20 ? `${email.slice(0, 20)}…` : email;
}

// Auth-aware (first chrome edit since slice 005). Now an async Server Component:
// the logged-out branch renders byte-identical to the pre-slice nav; the
// logged-in branch swaps the right-side affordances for the account link +
// sign-out. Everything else (wordmark, NAV_LINKS) is unchanged.
export async function TopNav() {
  const session = await auth();
  const user = session?.user;

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
          {user ? (
            <>
              <Link href="/account" className="text-text-secondary hover:text-text-primary">
                {user.name ?? truncateEmail(user.email ?? "")}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-button border border-border-default bg-surface-card px-snug py-2 font-medium text-text-primary hover:bg-surface-raised"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-text-secondary hover:text-text-primary">Sign in</Link>
              <Link href="/signup" className="rounded-button bg-accent-bristle px-snug py-2 font-medium text-surface-card">
                Start free →
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
