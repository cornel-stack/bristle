// Shared building blocks for the transactional auth emails (verify / reset /
// welcome). Pure string-returning functions — no images, no external CSS, inline
// styles only for email-client compatibility. Voice per CLAUDE.md §6: plain,
// no exclamation points, no hype, no emoji.

const TEXT = "#1a1a19";
const MUTED = "#6b6b65";
const CANVAS = "#fafaf7";

/** Bristle wordmark header line. */
export function brandHeader(): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:${TEXT};padding-bottom:16px;">Bristle</div>`;
}

/** Plain transactional footer — states why the recipient got the email. */
export function unsubscribeFooter(): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-top:24px;border-top:1px solid #e8e6df;margin-top:24px;">You're receiving this because you signed up at bristle.dev.</div>`;
}

/**
 * Wrap body HTML in the shared shell (canvas background, centered card, brand
 * header, transactional footer). `bodyHtml` is the message-specific middle.
 */
export function emailShell(bodyHtml: string): string {
  return [
    `<div style="background:${CANVAS};padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">`,
    `<div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8e6df;border-radius:8px;padding:32px;">`,
    brandHeader(),
    bodyHtml,
    unsubscribeFooter(),
    `</div>`,
    `</div>`,
  ].join("");
}

/** Primary action button (inline-styled anchor). */
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:10px 20px;border-radius:6px;">${label}</a>`;
}
