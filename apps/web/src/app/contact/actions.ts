"use server";

import {
  contactFormSchema,
  type ContactFormInput,
} from "@/components/contact/contact-schema";
import { CONTACT_TOPIC_LABELS } from "@/components/contact/contact-topics";
import { sendContactMessage } from "@/lib/resend";

/**
 * Raw values echoed back to the form on any error path. Strings exactly as the
 * user typed (pre-trim, pre-lowercase) so the form re-renders with their input
 * unchanged. Distinct from the zod-parsed ContactFormInput type (which holds
 * trimmed/lowercased/typed-enum values).
 */
export interface ContactFormRawValues {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
}

/**
 * Discriminated state union returned by submitContactForm and consumed by the
 * ContactForm client component via useActionState. Per plan decision §3:
 *  - "submitting" is NOT a status — pending comes from useActionState's third
 *    tuple element.
 *  - "not-configured" from the Resend wrapper collapses into "transport-error"
 *    here (the user-facing UI is one banner for both root causes; the server
 *    log preserves the underlying reason for diagnostics).
 *  - Both error variants carry `values` so the form repopulates the visitor's
 *    inputs on re-render (no data loss).
 */
export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "validation-error";
      fieldErrors: Partial<Record<keyof ContactFormInput, string>>;
      values: ContactFormRawValues;
    }
  | {
      status: "transport-error";
      values: ContactFormRawValues;
    };

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // _prevState is required by useActionState's contract but unused — each
  // submission is computed fresh from formData. The leading underscore
  // signals intentional non-use to the TS compiler.
  // Capture raw values first so we can echo them back on any error path.
  const raw: ContactFormRawValues = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    topic: formData.get("topic")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? "",
  };

  const result = contactFormSchema.safeParse(raw);

  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<keyof ContactFormInput, string>> = {};
    for (const key of ["name", "email", "topic", "message"] as const) {
      const msgs = flat[key];
      if (msgs && msgs.length > 0) {
        fieldErrors[key] = msgs[0];
      }
    }
    return { status: "validation-error", fieldErrors, values: raw };
  }

  const validated = result.data;
  const topicLabel = CONTACT_TOPIC_LABELS[validated.topic];

  const sendResult = await sendContactMessage({
    name: validated.name,
    email: validated.email,
    topic: topicLabel,
    message: validated.message,
  });

  if (!sendResult.ok) {
    // "not-configured" and "transport" both surface as the same banner to the
    // visitor (spec edge case + plan decision §3). The Resend wrapper has
    // already logged the underlying reason server-side for founder diagnostics.
    return { status: "transport-error", values: raw };
  }

  return { status: "success" };
}
