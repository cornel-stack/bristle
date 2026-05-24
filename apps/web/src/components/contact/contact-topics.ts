// Four contact-form topics. Kebab-case keys are the source of truth for the
// zod enum + the form's <select> values; display labels are the human-readable
// strings rendered in the dropdown and emailed to the founder in the email
// subject + body.

export const CONTACT_TOPIC_KEYS = [
  "product-question",
  "bug-report",
  "enterprise-inquiry",
  "press-or-other",
] as const;

export type ContactTopic = (typeof CONTACT_TOPIC_KEYS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  "product-question": "Product question",
  "bug-report": "Bug report",
  "enterprise-inquiry": "Enterprise inquiry",
  "press-or-other": "Press or other",
};
