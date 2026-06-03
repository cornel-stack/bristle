import { emailShell } from "./shared";

// Code-based verification email (replaces the slice-013 link template). Shows
// the 6 digits prominently; the user types them into /signup/verify-email.
// Inline styles + hex are the documented email-template carve-out from the
// tokens-only rule. Voice per §6 — plain, no exclamation, no hype.

const P = `style="font-size:15px;line-height:24px;color:#1a1a19;margin:0 0 16px;"`;
const MUTED = `style="font-size:13px;line-height:20px;color:#6b6b65;margin:16px 0 0;"`;
const CODE = `style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:600;letter-spacing:8px;color:#1a1a19;text-align:center;background:#f4f2ea;border-radius:8px;padding:16px 0;margin:0 0 16px;"`;

interface VerifyCodeEmailInput {
  code: string;
  expiresInMinutes: number;
  name?: string | null;
}

export function renderVerifyEmailCodeHtml({
  code,
  expiresInMinutes,
  name,
}: VerifyCodeEmailInput): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return emailShell(
    [
      `<p ${P}>${greeting}</p>`,
      `<p ${P}>Enter this code to verify your email and finish setting up your Bristle account.</p>`,
      `<p ${CODE}>${code}</p>`,
      `<p ${MUTED}>This code expires in ${expiresInMinutes} minutes. If you did not request this, you can ignore this email.</p>`,
    ].join(""),
  );
}

/** Plain-text alternative — same content, ASCII-formatted code. */
export function renderVerifyEmailCodeText({
  code,
  expiresInMinutes,
  name,
}: VerifyCodeEmailInput): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return [
    greeting,
    "",
    "Enter this code to verify your email and finish setting up your Bristle account:",
    "",
    `    ${code}`,
    "",
    `This code expires in ${expiresInMinutes} minutes. If you did not request this, you can ignore this email.`,
    "",
    "Bristle — bristle.dev",
  ].join("\n");
}
