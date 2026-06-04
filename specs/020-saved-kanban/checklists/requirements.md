# Specification Quality Checklist: Saved (Kanban Board)

**Created**: 2026-06-04 · **Feature**: [spec.md](../spec.md)

## Content Quality
- [x] No implementation details in requirements (component/file names only in plan/assumptions)
- [x] User value focused · [x] non-technical readable · [x] all mandatory sections

## Requirement Completeness
- [x] No [NEEDS CLARIFICATION] (open decisions = confirm-flagged Assumptions A1–A2)
- [x] Testable/unambiguous · [x] measurable SC · [x] tech-agnostic SC
- [x] Acceptance scenarios defined · [x] edge cases · [x] scope bounded · [x] deps/assumptions

## Feature Readiness
- [x] FRs have acceptance criteria · [x] scenarios cover flows · [x] SC measurable · [x] no impl leak

## Notes
- **A1 (write-persistence) is the tier-defining decision** — ephemeral recommended; the founder weighs it hardest (sets 4.6/4.7/4.9). **A2** (reorganize = move-menu, no dep) is the secondary decision.
- Carried, not open: real column counts (3/2/3/1) + the 28/50 meter literal (A4); `getAppUser` used as-is (A5); deferred Export/Compare (A6).
- Read-only diff (SC-006): `apps/web` + one read-only helper; no schema/seed; no shared/public leaf edited (new `SavedCard`, not `ProblemCardCompact`).
