// Auth.js v5 (next-auth@5) configuration — established slice 013, extended
// slice 014 (Google + GitHub OAuth). Exports { handlers, signIn, signOut, auth }
// consumed by the API route handler, middleware, Server Actions, and the
// auth-aware top nav / protected /account.
//
// SESSION STRATEGY — database (FR-012, 30-day). We keep the database strategy
// because FR-016 / SC-006 require server-side invalidation of all sessions on
// password reset (deleting `sessions` rows), which a stateless JWT cannot do.
//
// PROVIDERS — Google + GitHub (slice 014; was `[]` in slice 013). @auth/core's
// assertConfig() throws `UnsupportedStrategy` only when a Credentials provider
// is the *only* provider AND session.strategy is "database" (`dbStrategy &&
// onlyCredentials`). We ship NON-credentials providers and NO Credentials
// provider, so `onlyCredentials` is false and the rule cannot trip. OAuth
// sign-ins are persisted by the DrizzleAdapter (sessions + accounts rows). The
// credentials login path remains MANUAL (lib/auth/session.ts verifies the
// password and writes the DB session itself); auth() reads either uniformly via
// the pinned session cookie.

import NextAuth, { type NextAuthResult } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getDb,
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@bristle/db";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session-cookie";

/** 30 days, in seconds. */
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

if (!process.env.AUTH_SECRET) {
  // Fail loud at module load rather than producing silently-insecure sessions.
  throw new Error("AUTH_SECRET is not set — generate one with `openssl rand -base64 32`");
}

// Fail loud (same shape as AUTH_SECRET) if any OAuth credential is missing —
// surfaces a missing secret at build/boot, not as a broken sign-in button.
// These MUST also be listed in turbo.json build.env or the Vercel build dies at
// "Collecting page data" even when set in Vercel (the slice-013 AUTH_SECRET trap).
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
if (!GOOGLE_CLIENT_ID)
  throw new Error("GOOGLE_CLIENT_ID is not set — add it to .env.local, Vercel (Production+Preview), and turbo.json build.env");
if (!GOOGLE_CLIENT_SECRET)
  throw new Error("GOOGLE_CLIENT_SECRET is not set — add it to .env.local, Vercel (Production+Preview), and turbo.json build.env");
if (!GITHUB_CLIENT_ID)
  throw new Error("GITHUB_CLIENT_ID is not set — add it to .env.local, Vercel (Production+Preview), and turbo.json build.env");
if (!GITHUB_CLIENT_SECRET)
  throw new Error("GITHUB_CLIENT_SECRET is not set — add it to .env.local, Vercel (Production+Preview), and turbo.json build.env");

// Explicit annotations via NextAuthResult sidestep TS2742 ("inferred type
// cannot be named without a reference to .pnpm/…") — a known Auth.js v5 + pnpm
// portability quirk when re-exporting the destructured NextAuth() result.
const nextAuth = NextAuth({
  // Trust the host header explicitly. Auth.js v5 defaults trustHost to false in
  // production unless it auto-detects a known platform (the `VERCEL` env var) —
  // relying on that auto-detection is brittle and breaks any non-Vercel prod
  // (and local `next start`, which throws `UntrustedHost`). We deploy web behind
  // Vercel's trusted proxy, so pinning this true is safe and makes host trust
  // explicit rather than implicit. (Hardening added at the slice-013 STOP 6 gate.)
  trustHost: true,
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database", maxAge: SESSION_MAX_AGE },
  // signIn only. The Auth.js Email-provider `verifyRequest` page is
  // intentionally unset — Bristle verifies email with its own 6-digit code flow
  // (/signup/verify-email), not a provider magic link.
  pages: { signIn: "/login" },
  // Pin the session cookie name/options so the manual writer in the credentials
  // login action (lib/auth/session.ts) and this reader agree exactly.
  cookies: {
    sessionToken: { name: SESSION_COOKIE_NAME, options: SESSION_COOKIE_OPTIONS },
  },
  // Google + GitHub OAuth (slice 014). Non-credentials providers, so the v5
  // `onlyCredentials`+database-strategy assertion does not trip (it required a
  // Credentials provider to be the ONLY provider — we have none). OAuth sessions
  // are created by the DrizzleAdapter; the credentials login path stays manual
  // (lib/auth/session.ts). Scopes are profile+email only (FR-016).
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
    }),
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    // Database strategy: the second arg is the adapter user. Surface id +
    // emailVerified onto session.user for /account and the login gate.
    session({ session, user }) {
      session.user.id = user.id;
      session.user.emailVerified = user.emailVerified ?? null;
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = nextAuth.handlers;
export const auth: NextAuthResult["auth"] = nextAuth.auth;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut;
