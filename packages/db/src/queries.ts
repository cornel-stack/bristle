import { and, desc, eq, gt, ne } from "drizzle-orm";
import { getDb } from "./client";
import { problems, type Problem } from "./schema";
import {
  passwordResetTokens,
  sessions,
  users,
  verificationTokens,
  type User,
} from "./auth-schema";

export type ConsumeVerificationResult =
  | { ok: true; email: string; name: string | null }
  | { ok: false };

/**
 * Atomically consume an email-verification token: look it up, reject if missing
 * or expired (expired rows are pruned), else mark the user verified and delete
 * the token (single-use). All in one transaction so verify + delete cannot
 * partially apply. Returns the verified user's email + name for the welcome mail.
 */
export async function consumeVerificationToken(
  token: string,
): Promise<ConsumeVerificationResult> {
  return getDb().transaction(async (tx) => {
    const [vt] = await tx
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);
    if (!vt) return { ok: false };
    if (vt.expires.getTime() < Date.now()) {
      await tx
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return { ok: false };
    }
    const now = new Date();
    const [u] = await tx
      .update(users)
      .set({ emailVerified: now, updatedAt: now })
      .where(eq(users.email, vt.identifier))
      .returning({ email: users.email, name: users.name });
    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));
    if (!u) return { ok: false };
    return { ok: true, email: u.email, name: u.name };
  });
}

// Fetches one user by (already-normalized) email, or undefined if none. Used by
// the credentials authorize() and the auth Server Actions. Keeps Drizzle query
// construction inside @bristle/db so apps/web needs no direct drizzle-orm dep.
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row;
}

// Inserts a new (unverified) credentials user. Throws on the email unique
// constraint if the address is already taken — callers treat that as a generic
// failure (no enumeration).
export async function createUser(input: {
  email: string;
  name: string | null;
  passwordHash: string;
}): Promise<User> {
  const [row] = await getDb().insert(users).values(input).returning();
  if (!row) throw new Error("user insert returned no row");
  return row;
}

// Inserts an email-verification token (24h TTL set by the caller).
export async function createVerificationToken(input: {
  identifier: string;
  token: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(verificationTokens).values(input);
}

// Inserts a database session row. Used by the credentials login action, which
// must create the DB session itself (Auth.js core does not persist a database
// session for the Credentials provider — see apps/web/src/auth.ts).
export async function createSession(input: {
  sessionToken: string;
  userId: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(sessions).values(input);
}

// Inserts a password-reset token (1h TTL set by the caller, used=false default).
export async function createPasswordResetToken(input: {
  userId: string;
  token: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(passwordResetTokens).values(input);
}

// Read-only validity check for the /reset-password/[token] page pre-check:
// returns true only if the token exists, is unused, and is not expired. Does NOT
// consume the token (that is consumePasswordResetToken's atomic job).
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

// Atomically consume a password-reset token: re-check existence + unused +
// unexpired (TOCTOU — the page pre-check may be stale), update the user's
// password, mark the token used, and delete ALL of that user's sessions
// (log out everywhere on password change). One transaction.
export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string,
): Promise<{ ok: boolean }> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    if (!row || row.used || row.expires.getTime() < Date.now()) {
      return { ok: false };
    }
    const now = new Date();
    await tx
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: now })
      .where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, row.id));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
    return { ok: true };
  });
}

// Fetches the single problem for the homepage. Throws if none exists — a missing
// seed is a deployment defect, not a runtime empty state (Slice 1.4 non-goal).
export async function getFirstProblem(): Promise<Problem> {
  const [row] = await getDb().select().from(problems).limit(1);
  if (!row) throw new Error("No problem found — has the database been seeded?");
  return row;
}

// Fetches one problem by its stable slug. Throws if absent — same
// defect-not-empty-state semantics as getFirstProblem (used for the pinned hero).
export async function getProblemBySlug(slug: string): Promise<Problem> {
  const [row] = await getDb()
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  if (!row) throw new Error(`No problem found for slug "${slug}".`);
  return row;
}

// Fetches the most-recently-seen problems, optionally excluding one slug (used to
// keep the hero's pinned problem out of the sample row). Returns an empty array on
// an empty database — does NOT throw.
export async function getRecentProblems(opts: {
  limit: number;
  excludeSlug?: string;
}): Promise<Problem[]> {
  const { limit, excludeSlug } = opts;
  const base = getDb().select().from(problems);
  const filtered = excludeSlug
    ? base.where(ne(problems.slug, excludeSlug))
    : base;
  return filtered.orderBy(desc(problems.lastSeenAt)).limit(limit);
}
