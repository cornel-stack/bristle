"use server";

// Shared sign-out Server Action used by /account and the auth-aware top nav.
// signOut() (Auth.js) deletes the DB session via the adapter and clears the
// pinned session cookie, then redirects home. "use server" files may only
// export async functions (slice-013 C2 discovery) — this file holds exactly one.

import { signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
