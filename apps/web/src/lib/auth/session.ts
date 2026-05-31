// Manual database-session creation for the Credentials login path. Auth.js v5
// core does not persist a DB session for the Credentials provider, so the login
// Server Action calls this after verifying the password: it inserts a sessions
// row and sets the session cookie under the exact name auth() reads back.

import "server-only";

import { cookies } from "next/headers";

import { createSession } from "@bristle/db";

import { generateToken } from "./tokens";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_MS,
} from "./session-cookie";

/** Create a 30-day DB session for `userId` and set the session cookie. */
export async function createUserSession(userId: string): Promise<void> {
  const sessionToken = generateToken();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await createSession({ sessionToken, userId, expires });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionToken, {
    ...SESSION_COOKIE_OPTIONS,
    expires,
  });
}
