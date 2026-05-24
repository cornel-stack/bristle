// Zod schema for the contact form. Imported runtime-side ONLY by:
//   - apps/web/src/app/contact/actions.ts (Server Action, server-side validation)
// The client form (contact-form.tsx) imports only the `ContactFormInput` TYPE
// from this module via `import type` — that keeps the zod runtime out of the
// /contact client bundle (plan §10 perf budget; T021 verifies via First Load JS).

import { z } from "zod";

import { CONTACT_TOPIC_KEYS } from "./contact-topics";

// Plain-language error messages per CLAUDE.md §6 voice — these surface in the
// form's `aria-describedby` field-error <p> tags, so they're user-visible copy.
// No exclamation marks, no emoji, no "amazing/awesome" register.
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please add your name.")
    .max(100, "Name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That email address does not look valid."),
  topic: z.enum(CONTACT_TOPIC_KEYS, {
    message: "Please pick a topic.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "A few more words help us reply usefully.")
    .max(2000, "Message is too long."),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
