import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Auth.js v5 (next-auth@5) tables + one custom table, per
// specs/013-auth/data-model.md. The four adapter-managed tables (users,
// accounts, sessions, verificationTokens) keep the column NAMES Auth.js's
// DrizzleAdapter expects verbatim — camelCase for the standard columns,
// snake_case for the OAuth token fields (which mirror provider responses).
// `password_reset_tokens` is Bristle-custom (Auth.js ships no reset flow).
// Auth.js-managed timestamps use mode:"date" so the adapter gets JS Date values.

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }),
  image: text("image"),
  // Nullable since slice 014 (migration 0002): OAuth-only users (Google/GitHub)
  // are created by the Auth.js adapter with no password. The credentials login
  // path treats a null hash as "no password set" → generic invalid-credentials.
  passwordHash: text("passwordHash"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Slice 014 (migration 0002) — Bristle-custom code-verification + Terms fields
  // (snake_case, not adapter-managed). See specs/014-auth-fidelity/data-model.md.
  emailVerificationCode: text("email_verification_code"),
  emailVerificationCodeExpires: timestamp("email_verification_code_expires", {
    mode: "date",
    withTimezone: true,
  }),
  emailVerificationAttempts: integer("email_verification_attempts")
    .notNull()
    .default(0),
  termsAcceptedAt: timestamp("terms_accepted_at", {
    mode: "date",
    withTimezone: true,
  }),
  termsVersion: text("terms_version"),
});

// accounts uses the Auth.js-canonical compound PK (provider, providerAccountId)
// — the DrizzleAdapter's types require this exact shape (no surrogate id).
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

// sessions: sessionToken IS the primary key (adapter requirement — it looks up
// and deletes sessions by sessionToken). No surrogate id.
export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// Custom: one-time, 1h password-reset tokens. `used` flips true atomically with
// the password update (TOCTOU defense, FR-016); not touched by the adapter.
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
