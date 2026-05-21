# Quickstart / Verification: Slice 003

How to run and check the slice once implemented. (No code yet — this is the verification recipe the gate will follow.)

## Run locally
```bash
pnpm install
pnpm --filter web dev          # http://localhost:3000 → two cards + theme toggle
```

## Acceptance checks (map to SC-001…SC-010)

- **SC-001 — token diff**: extract the `--*` color vars from compiled CSS (or globals.css `:root`/`[data-theme="dark"]`) and diff against CLAUDE.md §4.1 + §4.1a. Expect zero discrepancies for all 29 themeable tokens × 2 themes.
- **SC-002 — fonts**: confirm `--font-inter`, `--font-source-serif`, `--font-jetbrains` are present on `<html>` and the `font-sans/serif/mono` utilities resolve to them (DevTools computed styles).
- **SC-003 — server component**: `grep -L "use client" packages/ui/src/problem-card-full.tsx` → file present (no directive). `grep "use client" packages/ui/src/problem-card-full.tsx` → no match.
- **SC-004 — no hex in card**: `grep -E "#[0-9A-Fa-f]{3,8}" packages/ui/src/problem-card-full.tsx packages/ui/src/sparkline.tsx` → no matches.
- **SC-005 — showcase**: page shows exactly two `ProblemCardFull` and one toggle.
- **SC-006 — toggle**: clicking sets `<html data-theme="dark">`; both cards switch to Editorial Dark; clicking again returns to light.
- **SC-007 — gates**: `pnpm typecheck && pnpm lint && pnpm --filter web build` all exit 0.
- **SC-008 — Lighthouse (prod build)**:
  ```bash
  pnpm --filter web build && pnpm --filter web start
  # run Lighthouse against http://localhost:3000 → Performance ≥90, Accessibility ≥90
  ```
- **SC-009 — preview parity**: push branch → Vercel preview renders the showcase identically to local.
- **SC-010 — visual match**: compare card against `design/Core_app.pdf` p.1 at 1:1; pill/sparkline/title/quote/footer within 4px.

## Notes
- Lighthouse is measured on the **production build** (`build && start`), not `dev` (Decision/SC-008).
- Theme toggle writes **nothing** to storage; refresh resets to light (expected this slice).
