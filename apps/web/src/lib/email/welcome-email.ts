import { emailButton, emailShell } from "./shared";

const P = `style="font-size:15px;line-height:24px;color:#1a1a19;margin:0 0 16px;"`;
const MUTED = `style="font-size:13px;line-height:20px;color:#6b6b65;margin:16px 0 0;"`;

/** Welcome email — sent after email verification completes. */
export function renderWelcomeEmailHtml({
  name,
  signInUrl,
}: {
  name?: string | null;
  signInUrl: string;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return emailShell(
    [
      `<p ${P}>${greeting}</p>`,
      `<p ${P}>Your email is verified and your Bristle account is ready.</p>`,
      `<p style="margin:0 0 16px;">${emailButton(signInUrl, "Sign in")}</p>`,
      `<p ${MUTED}>Questions? Reach us at hello@bristle.dev.</p>`,
    ].join(""),
  );
}
