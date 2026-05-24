"use client";

// The only client component in slice 008. Owns the useActionState hook that
// posts the form to the submitContactForm Server Action.
//
// Intentionally does NOT import the runtime contactFormSchema — only the
// ContactFormState type is needed and it comes through actions.ts. This keeps
// the zod runtime out of the client bundle (plan §10 perf budget; T021
// verifies via First Load JS).

import { useActionState, useEffect, useRef } from "react";

import { submitContactForm, type ContactFormState } from "@/app/contact/actions";

import { ContactFormError } from "./contact-form-error";
import { ContactFormSuccess } from "./contact-form-success";
import {
  CONTACT_TOPIC_KEYS,
  CONTACT_TOPIC_LABELS,
} from "./contact-topics";

const INITIAL_STATE: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Focus management on state transition (decision §7):
  //   - success → focus heading (data-form-state="success")
  //   - validation-error → focus first invalid field (aria-invalid="true")
  //   - transport-error → focus banner (data-form-state="transport-error")
  //   - idle → no focus change (first render; no-op)
  useEffect(() => {
    if (state.status === "idle") return;

    if (state.status === "success") {
      const target = document.querySelector<HTMLElement>(
        '[data-form-state="success"]',
      );
      target?.focus();
      return;
    }

    if (state.status === "validation-error") {
      const target = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      target?.focus();
      return;
    }

    if (state.status === "transport-error") {
      const target = document.querySelector<HTMLElement>(
        '[data-form-state="transport-error"]',
      );
      target?.focus();
      return;
    }
  }, [state]);

  // Success state replaces the form entirely.
  if (state.status === "success") {
    return <ContactFormSuccess />;
  }

  // Echo back user inputs on any error path (no data loss).
  const values =
    state.status === "validation-error" || state.status === "transport-error"
      ? state.values
      : {};
  const fieldErrors =
    state.status === "validation-error" ? state.fieldErrors : {};

  return (
    <div className="flex flex-col gap-grid">
      {state.status === "transport-error" ? <ContactFormError /> : null}

      <form
        ref={formRef}
        action={formAction}
        aria-busy={pending}
        noValidate
        className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
      >
        {/* Name */}
        <div className="flex flex-col gap-tight">
          <label
            htmlFor="contact-name"
            className="text-body-sm font-medium text-text-primary"
          >
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={values.name ?? ""}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={
              fieldErrors.name ? "contact-name-error" : undefined
            }
            className="rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          />
          {fieldErrors.name ? (
            <p
              id="contact-name-error"
              className="text-body-sm text-status-error"
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-tight">
          <label
            htmlFor="contact-email"
            className="text-body-sm font-medium text-text-primary"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            defaultValue={values.email ?? ""}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={
              fieldErrors.email ? "contact-email-error" : undefined
            }
            className="rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          />
          {fieldErrors.email ? (
            <p
              id="contact-email-error"
              className="text-body-sm text-status-error"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        {/* Topic */}
        <div className="flex flex-col gap-tight">
          <label
            htmlFor="contact-topic"
            className="text-body-sm font-medium text-text-primary"
          >
            Topic
          </label>
          <select
            id="contact-topic"
            name="topic"
            required
            defaultValue={values.topic ?? ""}
            aria-invalid={fieldErrors.topic ? true : undefined}
            aria-describedby={
              fieldErrors.topic ? "contact-topic-error" : undefined
            }
            className="rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            <option value="" disabled>
              Pick one
            </option>
            {CONTACT_TOPIC_KEYS.map((key) => (
              <option key={key} value={key}>
                {CONTACT_TOPIC_LABELS[key]}
              </option>
            ))}
          </select>
          {fieldErrors.topic ? (
            <p
              id="contact-topic-error"
              className="text-body-sm text-status-error"
            >
              {fieldErrors.topic}
            </p>
          ) : null}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-tight">
          <label
            htmlFor="contact-message"
            className="text-body-sm font-medium text-text-primary"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            defaultValue={values.message ?? ""}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={
              fieldErrors.message ? "contact-message-error" : undefined
            }
            className="resize-y rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          />
          {fieldErrors.message ? (
            <p
              id="contact-message-error"
              className="text-body-sm text-status-error"
            >
              {fieldErrors.message}
            </p>
          ) : null}
        </div>

        {/* Submit + caption */}
        <div className="flex flex-wrap items-center gap-grid">
          <button
            type="submit"
            disabled={pending}
            className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
          <p className="text-body-sm text-text-secondary">
            We respond within one business day.
          </p>
        </div>
      </form>
    </div>
  );
}
