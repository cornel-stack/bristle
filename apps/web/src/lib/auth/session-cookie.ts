// Single source of truth for the session cookie name + options, shared by:
//   - auth.ts (the framework READER — set explicitly in NextAuth cookies config)
//   - lib/auth/session.ts (our manual WRITER in the credentials login action)
//   - middleware.ts (Batch D — cookie-presence check)
// Mirrors Auth.js v5 defaults (the __Secure- prefix requires secure+https), but
// pinned here so reader and writer cannot drift (decisions 14a/14c). No heavy
// imports, so auth.ts/middleware can import it without pulling in db/next-headers.

const isProd = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = isProd
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProd,
};

/** 30 days in milliseconds (matches auth.ts session.maxAge). */
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
