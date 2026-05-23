# Research: Pricing Recalibration

Phase 0 decisions. Format: Decision / Rationale / Alternatives.

## D1 — §9 acceptable-edit precedent: values-only edits to shipped slice files

- **Decision**: Slice 007 is a values-only edit to three files that shipped in slices 005 and 006. CLAUDE.md §9 forbids `design/` and PDF edits and FR-022 of slice 006 forbids structural changes to slice-006 chrome — but neither rule covers value-level edits to in-app content fields. Slice 006 FR-016 explicitly mandated a one-line href flip (`/help` → `/faq`) in slice-005's `site-footer.tsx`; that's the project's first precedent for a values-only edit to a shipped slice file, and it was accepted and shipped. Slice 007 extends the same pattern to three files instead of one, all touching string/numeric value fields only.
- **Rationale**: The protection §9 + FR-022 give to shipped slices is about **structural** integrity (file existence, component boundaries, JSX skeletons, exported types, tokens, design contracts). Value fields (price strings, href targets, copy text) are content — they're expected to change post-launch. Forbidding all value edits to shipped slices would force every product copy correction into a fresh component, which is the opposite of additive-only. The discipline that's been working: structural changes need a new file and a fresh spec; value changes can edit existing fields in place with a tight spec that names the exact field-level changes (which is what slice 007's spec does).
- **Alternatives**:
  - *Forbid all edits to shipped slice files* — rejected. Would require slice 007 to create three new "price override" files and wire them through, structural change for a content change.
  - *Always require a new component for a price change* — rejected, same reason. Plus it duplicates state of truth (the override file shadows the original) and creates a stale-original cleanup tail.
  - *Treat this slice's three edits as a structural exception* — rejected. The slice-006 footer href flip already set the precedent; this slice formalizes it.

## D2 — Single-batch implementation (not 4-batch / 4-STOP)

- **Decision**: T001 → T002 → T003 → T004 → T005, one STOP at the end (after T005). Five tasks total: 3 commit-producing + 2 verification gates.
- **Rationale**: The 4-batch / 4-STOP shape used in slices 005 (19 tasks across 4 batches) and 006 (22 tasks across 4 batches) optimizes for multi-file dependency graphs with foundation → primitive → composition → assembly phases. Slice 007 has no graph — three independent value edits, no shared types added, no new dependency, no schema, no new component. Batching three edits across four review checkpoints would add four review cycles for a 5-minute set of edits. The cost/benefit clearly favors a single batch with one final STOP.
- **Alternatives**:
  - *3-batch (one per edited file)* — rejected. Each batch is one task; STOPping after each adds review-cycle friction for no payoff (the next file's edit has no dependency on the previous one).
  - *2-batch (edits + gates)* — rejected. The gates are already two of the five tasks; collapsing them into one "verification batch" splits the natural sequencing of "all edits done, then verify locally, then verify on preview" across two stops.
  - *Skip the spec/plan/tasks ceremony entirely for a 3-file content edit* — rejected. The point of Spec Kit is the audit trail. The four clarifications surfaced by writing this spec (PDF drift policy, non-tier-mapped slice convention, founder commitment, batching norm) all matter beyond this slice; capturing them once as a precedent saves the same conversation on every future patch slice.

## D3 — PDF↔code drift carve-out scope (prices only)

- **Decision**: From this slice onward, `apps/web/src/components/pricing/tier-data.ts` is the **source of truth for tier prices specifically**. `design/Public_pages.pdf` page 3 retains $29 / $79 / $199 as a historical v1 artifact and is **not re-rendered** by this slice. The visual-diff gate at the next pricing-touching slice (whenever that lands) gets a 4px-tolerance carve-out for the six price strings on the Pricing page (3 Monthly: $19 / $49 / $149; 3 Annual: $13 / $34 / $104) and the three rows on the landing's dark-band pricing teaser. **Every other PDF-encoded surface remains read-only contract** per CLAUDE.md §9.1 — typography, spacing, color tokens, headings, layout positions, hero copy, FAQ structure, source-strip wordmarks, source icons, the OG image, the compare table values, the "Most popular" tag, the "-30%" badge, the Enterprise card, and every other non-price element are unchanged and continue to be verified against the PDF byte-for-byte.
- **Rationale**: A single content category (prices) is what the founder revised between v1 design and post-2.2 launch. Re-rendering the PDF for three numeric values would (a) require design-tool effort disproportionate to the change, (b) re-render thousands of other pixels that haven't changed and risk introducing 4px drift elsewhere via tool quirks, and (c) make the PDF a churning artifact rather than a stable v1 reference. The carve-out approach keeps the PDF stable, lets the code evolve, and explicitly enumerates the scope of the divergence so reviewers know what to ignore.
- **Alternatives**:
  - *Re-render `design/Public_pages.pdf` page 3 to match $19 / $49 / $149* — rejected. Too much design-tool effort for three numeric values; risks introducing unrelated 4px drift; turns the PDF into a churning artifact.
  - *Defer the price recalibration until the PDF can be re-rendered* — rejected. The recalibration is a positioning decision the founder wants live before launch; the PDF re-render is bookkeeping that doesn't gate user value.
  - *Drift on everything, not just prices* — rejected. Sets a bad precedent that the PDFs are advisory rather than the visual contract; would erode the 4px-tolerance gate over time. Carving out prices specifically (one named content category, one named file as source of truth) keeps the rest of the contract intact.

## D4 — Annual price invariant via the existing multiplier

- **Decision**: The Annual prices ($13 / $34 / $104) are not coded anywhere — they derive from the existing `Math.round(monthlyPriceUsd × 0.7)` expression in `apps/web/src/components/pricing/tier-card.tsx` (slice 006, line ~14). Slice 007 changes only the inputs (the three `monthlyPriceUsd` fields in `tier-data.ts`); the multiplier and the rendering code are untouched.
- **Rationale**: Centralizing the math in `TierCard` was the right call in slice 006 — it makes price recalibrations (like this slice) a one-line edit per tier rather than a six-line edit (Monthly + Annual per tier). Slice 007 validates that decision. The "Annual saves 30%" subhead on the pricing hero stays accurate because the savings come from the multiplier (0.7 = exactly 30% off), not the dollar values; this slice doesn't touch the subhead.
- **Alternatives**:
  - *Hardcode Annual prices alongside Monthly in `tier-data.ts`* — rejected, redundant with the multiplier and creates two sources of truth that can drift.
  - *Move the multiplier into `tier-data.ts` as a named export* — rejected for this slice (structural change to slice-006 file; would expand scope from values-only); reasonable follow-up if the multiplier ever needs to vary by tier.
