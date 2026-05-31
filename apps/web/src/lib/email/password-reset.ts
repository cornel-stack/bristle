import { emailButton, emailShell } from "./shared";

const P = `style="font-size:15px;line-height:24px;color:#1a1a19;margin:0 0 16px;"`;
const MUTED = `style="font-size:13px;line-height:20px;color:#6b6b65;margin:16px 0 0;"`;

/** Password-reset email body — 1h link. Plain, transactional. */
export function renderPasswordResetEmailHtml({
  resetUrl,
  name,
}: {
  resetUrl: string;
  name?: string | null;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return emailShell(
    [
      `<p ${P}>${greeting}</p>`,
      `<p ${P}>We received a request to reset your Bristle password.</p>`,
      `<p style="margin:0 0 16px;">${emailButton(resetUrl, "Reset password")}</p>`,
      `<p ${MUTED}>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    ].join(""),
  );
}
