// Server-only senders for the auth transactional emails. Mirrors the slice-008
// lib/resend.ts contract: reads env per-call (so it flips not-configured →
// configured the moment env lands, no rebuild), constructs Resend per-call,
// returns a structured result instead of throwing. Uses EMAIL_FROM (distinct
// from slice-008's CONTACT_FORM_FROM).

import "server-only";

import { Resend } from "resend";

import { renderPasswordResetEmailHtml } from "./email/password-reset";
import { renderVerifyEmailHtml } from "./email/verify-email";
import {
  renderVerifyEmailCodeHtml,
  renderVerifyEmailCodeText,
} from "./email/verify-email-code";
import { renderWelcomeEmailHtml } from "./email/welcome-email";
import { CODE_TTL_MS } from "./auth/email-verification-code";

export type SendEmailResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "transport" };

async function send(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, reason: "not-configured" };
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
    if (error) {
      console.error("[auth-emails] send failed:", error);
      return { ok: false, reason: "transport" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[auth-emails] threw:", err);
    return { ok: false, reason: "transport" };
  }
}

// Slice-013 link sender — kept additively; T026 removes it once its consumers
// (createAccount switches in T022, verify-email-sent deleted in T026) are gone.
export function sendVerificationEmail(input: {
  email: string;
  name?: string | null;
  verifyUrl: string;
}): Promise<SendEmailResult> {
  return send(
    input.email,
    "Verify your Bristle email",
    renderVerifyEmailHtml({ verifyUrl: input.verifyUrl, name: input.name }),
  );
}

export function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
}): Promise<SendEmailResult> {
  const expiresInMinutes = Math.round(CODE_TTL_MS / 60_000);
  return send(
    input.email,
    // Code in the subject for fast scanning (spec C-d).
    `Your Bristle verification code: ${input.code}`,
    renderVerifyEmailCodeHtml({
      code: input.code,
      expiresInMinutes,
      name: input.name,
    }),
    renderVerifyEmailCodeText({
      code: input.code,
      expiresInMinutes,
      name: input.name,
    }),
  );
}

export function sendWelcomeEmail(input: {
  email: string;
  name?: string | null;
  signInUrl: string;
}): Promise<SendEmailResult> {
  return send(
    input.email,
    "Welcome to Bristle",
    renderWelcomeEmailHtml({ name: input.name, signInUrl: input.signInUrl }),
  );
}

export function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  resetUrl: string;
}): Promise<SendEmailResult> {
  return send(
    input.email,
    "Reset your Bristle password",
    renderPasswordResetEmailHtml({ resetUrl: input.resetUrl, name: input.name }),
  );
}
