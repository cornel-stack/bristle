// Server-only Resend wrapper for the contact form. Belt-and-suspenders against
// accidental client-import: `import "server-only"` throws a build error if any
// "use client" module ever imports from here, which would expose RESEND_API_KEY
// to the browser bundle.

import "server-only";

import { Resend } from "resend";

export type SendContactMessageResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "transport" };

interface SendContactMessageInput {
  name: string;
  email: string;
  /** Display label (e.g. "Product question"), not the kebab-case enum key. */
  topic: string;
  message: string;
}

/**
 * Sends the contact form payload via Resend.
 *
 * - Reads RESEND_API_KEY / CONTACT_FORM_RECIPIENT / CONTACT_FORM_FROM from
 *   `process.env` on every invocation (NOT memoized). This lets the form
 *   transition from not-configured → configured the moment env vars land in
 *   Vercel — no rebuild required.
 * - Constructs `new Resend(apiKey)` per call (not a module singleton). The
 *   SDK is a thin HTTP wrapper with no connection pool, so per-call is fine.
 * - Returns a structured result instead of throwing. The Server Action and
 *   the client form switch on `reason` to render the right UI (graceful
 *   degradation per spec FR-013 / clarification (a)).
 */
export async function sendContactMessage(
  input: SendContactMessageInput,
): Promise<SendContactMessageResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_FORM_RECIPIENT;
  const from = process.env.CONTACT_FORM_FROM;

  if (!apiKey || !to || !from) {
    return { ok: false, reason: "not-configured" };
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: input.email,
      subject: `Bristle contact: ${input.topic} from ${input.name}`,
      text: renderEmailBody(input),
    });
    if (error) {
      console.error("[resend] send failed:", error);
      return { ok: false, reason: "transport" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[resend] threw:", err);
    return { ok: false, reason: "transport" };
  }
}

function renderEmailBody(input: SendContactMessageInput): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Topic: ${input.topic}`,
    ``,
    `--`,
    ``,
    input.message,
  ].join("\n");
}
