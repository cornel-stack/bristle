// Auth.js v5 (next-auth@5) configuration — the heart of slice 013.
// Exports { handlers, signIn, signOut, auth } consumed by the API route handler,
// middleware, Server Actions, and the auth-aware top nav / protected /account.
//
// SESSION STRATEGY — database (FR-012, 30-day). NOTE (execution-time finding):
// Auth.js's Credentials provider does not, on its own, persist a *database*
// session — core forces JWT for credentials sign-in. We deliberately keep the
// database strategy because FR-016 / SC-006 require server-side invalidation of
// all sessions on password reset (deleting `sessions` rows), which JWT cannot do.
// The credentials login Server Action (T017) therefore creates the database
// session explicitly via the adapter after verifying the password. `authorize`
// here only validates the credential and returns the user; it does NOT enforce
// email-verification — the login action does, so it can show a resend nudge (C-c).

import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getDb,
  getUserByEmail,
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@bristle/db";

import { verifyPassword } from "@/lib/auth/password";
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
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
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
