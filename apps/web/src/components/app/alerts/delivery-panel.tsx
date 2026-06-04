import { AtSign, Bell, Hash, Webhook } from "lucide-react";

// Delivery channels — VISUAL-ONLY this slice (real delivery is Tier 6
// Settings/Billing/Delivery). Mirrors the page-5 panel.
const CHANNELS = [
  { key: "email", label: "Email", target: "elena@bristle.dev", on: true, Icon: AtSign },
  { key: "slack", label: "Slack", target: "#bristle-feed in Workspace", on: true, Icon: Hash },
  { key: "webhook", label: "Webhook", target: "hooks.studio.io/bristle", on: false, Icon: Webhook },
  { key: "in-app", label: "In-app", target: "always on", on: true, Icon: Bell },
];

export function DeliveryPanel() {
  return (
    <section className="rounded-card border border-border-default bg-surface-card p-grid">
      <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">Delivery</p>
      <ul className="mt-grid flex flex-col gap-grid">
        {CHANNELS.map((c) => (
          <li key={c.key} className="flex items-center gap-2.5">
            <c.Icon className="size-4 shrink-0 text-text-tertiary" strokeWidth={1.5} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-body-sm text-text-primary">{c.label}</span>
              <span className="block truncate text-body-sm text-text-tertiary">{c.target}</span>
            </span>
            <span
              className={`rounded-pill px-2 py-0.5 text-body-sm font-medium ${
                c.on ? "text-accent-validated" : "text-text-tertiary"
              }`}
            >
              {c.on ? "On" : "Off"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
