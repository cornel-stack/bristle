# Specification Quality Checklist: Command Palette (⌘K)

**Created**: 2026-06-05 · **Feature**: [spec.md](../spec.md)

## Content / Completeness / Readiness
- [x] No impl detail in requirements · user-value focused · readable · mandatory sections
- [x] No [NEEDS CLARIFICATION] (A1 is THE flagged decision; A2–A4 confirm-flags) · testable · measurable SC
- [x] Acceptance scenarios · edge cases · scope bounded · deps/assumptions

## Notes
- **A1 (cmdk vs hand-roll) is the gating decision** — the one explicit no-dep exception on the table; styled with tokens either way; only the widget internals differ.
- A2: Save shortcut routes to the detail (no global write); compare via ?compare= (URL, global). A3: sanctioned 4.2 shell touch (layout mount + topbar trigger) + getCommandIndex read helper. A4: actions are navigations.
- Read-only: index the real 15 + 8; no schema/seed; no DB write; no localStorage.
