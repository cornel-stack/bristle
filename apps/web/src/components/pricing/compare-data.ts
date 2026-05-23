export type CompareCell = string | { kind: "check" } | { kind: "dash" };

export interface CompareRow {
  label: string;
  starter: CompareCell;
  pro: CompareCell;
  team: CompareCell;
}

export const COMPARE_ROWS: readonly CompareRow[] = [
  {
    label: "Tracked categories",
    starter: "5",
    pro: "Unlimited",
    team: "Unlimited",
  },
  {
    label: "Saved problems",
    starter: "50",
    pro: "Unlimited",
    team: "Unlimited",
  },
  {
    label: "Alert delivery",
    starter: "Daily email",
    pro: "Email · in-app · API",
    team: "Email · Slack · webhook",
  },
  {
    label: "Comparison view",
    starter: { kind: "dash" },
    pro: "Up to 4",
    team: "Up to 4",
  },
  {
    label: "API access",
    starter: { kind: "dash" },
    pro: "50k req/mo",
    team: "200k req/mo",
  },
  {
    label: "Team seats",
    starter: "1",
    pro: "1",
    team: "5 included",
  },
  {
    label: "Shared collections",
    starter: { kind: "dash" },
    pro: { kind: "dash" },
    team: { kind: "check" },
  },
  {
    label: "SSO",
    starter: { kind: "dash" },
    pro: { kind: "dash" },
    team: { kind: "check" },
  },
  {
    label: "Support",
    starter: "Community",
    pro: "Priority email",
    team: "Dedicated CSM",
  },
] as const;
