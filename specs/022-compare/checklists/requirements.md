# Specification Quality Checklist: Compare

**Created**: 2026-06-05 · **Feature**: [spec.md](../spec.md)

## Content / Completeness / Readiness
- [x] No impl detail in requirements · user-value focused · readable · mandatory sections
- [x] No [NEEDS CLARIFICATION] (open items = A1–A4 confirm-flags) · testable · measurable + tech-agnostic SC
- [x] Acceptance scenarios · edge cases · scope bounded · deps/assumptions

## Notes
- A1: Compare reframed as a READ slice — URL-param `?compare=` (no comparisons table → no write). Settled read-dichotomy.
- A2: two SANCTIONED shipped-slice touches (4.5 Saved button→Link; 4.4 Library checkbox-select) — exact diff in the manifest; recommend wire all three entries, deferrable to picker+Saved.
- A3: 6 derived quantitative rows + 5 compare_card scorecards + Bristle's Read; new compare-adapter validates the JSONB; read reuses getProblemDetail ≤4× (no new packages/db helper).
- Carried: compare_card qualitative-only (quantitative derives from relational tables); 5-source delta (Sources "X of 5"); no schema/seed; no DB write.
