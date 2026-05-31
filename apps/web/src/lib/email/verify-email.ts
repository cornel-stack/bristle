import { emailButton, emailShell } from "./shared";

const P = `style="font-size:15px;line-height:24px;color:#1a1a19;margin:0 0 16px;"`;
const MUTED = `style="font-size:13px;line-height:20px;color:#6b6b65;margin:16px 0 0;"`;

/** Verification email body — 24h link. Plain, transactional, no marketing. */
export function renderVerifyEmailHtml({
  verifyUrl,
  name,
}: {
  verifyUrl: string;
  name?: string | null;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return emailShell(
    [
      `<p ${P}>${greeting}</p>`,
      `<p ${P}>Confirm your email to finish setting up your Bristle account.</p>`,
      `<p style="margin:0 0 16px;">${emailButton(verifyUrl, "Verify email")}</p>`,
      `<p ${MUTED}>This link expires in 24 hours. If you did not create a Bristle account, you can ignore this email.</p>`,
    ].join(""),
  );
}
