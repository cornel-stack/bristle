// Edge middleware: protect routes by SESSION COOKIE PRESENCE only — no DB read
// (the postgres driver can't run at the edge; see plan R5). This is a fast UX
// redirect; the destination page's server-side auth() is the authoritative
// check and will redirect again if the cookie is stale/invalid. Uses the shared
// SESSION_COOKIE_NAME so writer (login action), reader (auth()), and this
// middleware never drift.

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL("/login", request.nextUrl);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Future product slices add their protected paths to this array.
export const config = {
  matcher: ["/account/:path*", "/onboarding/:path*"],
};
