// Auth.js v5 (next-auth@5) configuration — the heart of slice 013.
// Exports { handlers, signIn, signOut, auth } consumed by the API route handler,
// middleware, Server Actions, and the auth-aware top nav / protected /account.
//
// SESSION STRATEGY — database (FR-012, 30-day). We keep the database strategy
// because FR-016 / SC-006 require server-side invalidation of all sessions on
// password reset (deleting `sessions` rows), which a stateless JWT cannot do.
//
// NO PROVIDERS (execution-time fix — see plan decision 7). @auth/core's
// assertConfig() throws `UnsupportedStrategy` on EVERY auth() call when a
// Credentials provider is the *only* provider AND session.strategy is "database"
// (assert.js: `if (dbStrategy && onlyCredentials)`). With a Credentials provider
// present that broke every authenticated request — auth() threw, the session
// resolved to null, and protected pages bounced back to /login in a loop. The
// credentials login Server Action (T017) never called Auth.js signIn() anyway:
// it verifies the password and creates the database session itself via the
// adapter (lib/auth/session.ts), so the Credentials provider was dead code.
// Dropping it lets auth() read that manual DB session. When OAuth lands
// (deferred), adding a non-credentials provider is safe — `onlyCredentials`
// becomes false, so the rule no longer trips.

import NextAuth, { type NextAuthResult } from "next-auth";
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
  pages: { signIn: "/login", verifyRequest: "/signup/verify-email-sent" },
  // Pin the session cookie name/options so the manual writer in the credentials
  // login action (lib/auth/session.ts) and this reader agree exactly.
  cookies: {
    sessionToken: { name: SESSION_COOKIE_NAME, options: SESSION_COOKIE_OPTIONS },
  },
  // Empty by design — see the NO PROVIDERS note in the header. The credentials
  // login flow is manual (lib/auth/session.ts); auth() is used only to READ the
  // database session, which needs no provider.
  providers: [],
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
