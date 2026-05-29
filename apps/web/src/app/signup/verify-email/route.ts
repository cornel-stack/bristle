// Email-verification callback. Consumes the ?token, marks the user verified,
// deletes the token (single-use, replay-safe), sends the welcome email, and
// redirects to /login. force-dynamic because it reads per-request query params.

import { NextResponse, type NextRequest } from "next/server";

import { consumeVerificationToken } from "@bristle/db";
import { SITE_URL } from "@bristle/shared";

import { sendWelcomeEmail } from "@/lib/auth-emails";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/signup?error=verify", request.nextUrl));
  }

  // Atomic: verify user + delete token in one transaction (see @bristle/db).
  const result = await consumeVerificationToken(token);
  if (!result.ok) {
    return NextResponse.redirect(new URL("/signup?error=verify", request.nextUrl));
  }

  // Best-effort welcome mail — awaited (serverless reliability) but its
  // structured result never throws, so a send failure cannot block the redirect.
  await sendWelcomeEmail({
    email: result.email,
    name: result.name,
    signInUrl: `${SITE_URL}/login`,
  });

  return NextResponse.redirect(new URL("/login?verified=true", request.nextUrl));
}
