// The five static first-run-tour steps (A4 mapping). A neutral, non-client module
// (no "use client", no reads, no fixtures) shared by the tour island — the
// slice-015 constants.ts pattern. `targetKey` resolves to a `data-tour="<key>"`
// anchor on an in-app component; the closing step has none → the bubble centers.
// Voice per §6: plain-spoken, dry, no exclamation, no emoji.

export type TourTargetKey = "palette" | "problem-card" | "saved" | "alerts";

export type TourStep = {
  index: number;
  title: string;
  body: string;
  tip?: string;
  targetKey?: TourTargetKey;
};

export const TOUR_STEPS: readonly TourStep[] = [
  {
    index: 0,
    title: "Start with the command palette.",
    body: "Press ⌘K from anywhere to jump to a problem, switch categories, or open a comparison — no clicking through the nav.",
    tip: "⌘K opens it · Esc closes it.",
    targetKey: "palette",
  },
  {
    // Design-confirmed step (onboarding.pdf p.3) — copy + tip are the contract.
    index: 1,
    title: "This is a problem card.",
    body: "Every card shows momentum, the loudest pull-quote, and the sources where it surfaced. Click anywhere to open the full report — synthesis, 47 quotes, existing solutions, and willingness-to-pay signals.",
    tip: "Tip — press S to save · C to add to a comparison.",
    targetKey: "problem-card",
  },
  {
    index: 2,
    title: "Save what's worth a second look.",
    body: "Press S on any card or report to add it to Saved, then organize candidates into collections on the board.",
    tip: "Press S to save the focused problem.",
    targetKey: "saved",
  },
  {
    index: 3,
    title: "Let momentum come to you.",
    body: "Set a watch rule and Alerts queues new mentions, momentum jumps, and willingness-to-pay signals for the categories you track.",
    targetKey: "alerts",
  },
  {
    // Closing step — no targetKey → centered bubble, no spotlight ring.
    index: 4,
    title: "That's the tour.",
    body: "Everything else is one keystroke away. ⌘K is always there when you need it.",
  },
] as const;

export const TOUR_LENGTH = TOUR_STEPS.length;
