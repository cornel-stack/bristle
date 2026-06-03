"use server";

// OAuth sign-in Server Actions (slice 014 hotfix). Auth.js v5 initiates OAuth
// via signIn() server-side (POST / Server Action) — the v4 GET-to-anchor
// pattern (/api/auth/signin/google?callbackUrl=…) throws UnknownAction on
// v5-beta.31. signIn() builds the CSRF + state cookies and the provider
// authorization URL, then redirects to the provider. `redirectTo` is where the
// user lands AFTER the callback completes — our progress page, which
// short-circuits to /account once auth() sees the session.

import { signIn } from "@/auth";

export async function signInWithGoogle(callbackUrl?: string): Promise<void> {
  await signIn("google", { redirectTo: callbackUrl ?? "/auth/callback/google" });
}

export async function signInWithGitHub(callbackUrl?: string): Promise<void> {
  await signIn("github", { redirectTo: callbackUrl ?? "/auth/callback/github" });
}
