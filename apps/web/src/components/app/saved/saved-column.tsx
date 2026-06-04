import type { Problem } from "@bristle/db";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

import { dotClass } from "./collection-color";
import { SavedCard } from "./saved-card";
import type { BoardColumn } from "./saved-board";

// One board column. Reorganize uses accessible native <select> controls (no DnD
// dependency, A2): a VISIBLE "Move to…" select on every card (clear, keyboard-
// operable — not a buried overflow) + a Remove button, plus an "+ Add problem"
// select. The column name is rename-editable inline. All actions call handlers on
// the board (the ephemeral state owner).
export function SavedColumn({
  column,
  allColumns,
  addable,
  onMoveCard,
  onRemoveCard,
  onRename,
  onAddProblem,
}: {
  column: BoardColumn;
  allColumns: { id: string; name: string }[];
  addable: Problem[];
  onMoveCard: (cardSlug: string, toColId: string) => void;
  onRemoveCard: (cardSlug: string) => void;
  onRename: (name: string) => void;
  onAddProblem: (problemSlug: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.name);
  const others = allColumns.filter((c) => c.id !== column.id);

  function commitRename() {
    const next = draft.trim();
    if (next) onRename(next);
    else setDraft(column.name);
    setEditing(false);
  }

  return (
    <section className="flex w-72 shrink-0 flex-col" aria-label={column.name}>
      <div className="flex items-center gap-2 px-1 pb-grid">
        <span className={`size-2.5 shrink-0 rounded-pill ${dotClass(column.color)}`} aria-hidden="true" />
        {editing ? (
          <span className="flex flex-1 items-center gap-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(column.name);
                  setEditing(false);
                }
              }}
              aria-label="Collection name"
              className="min-w-0 flex-1 rounded-button border border-border-default bg-surface-card px-2 py-0.5 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            />
            <button type="button" onClick={commitRename} aria-label="Save name" className="text-text-secondary hover:text-text-primary">
              <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </span>
        ) : (
          <>
            <h2 className="flex-1 truncate text-body-md font-medium text-text-primary">{column.name}</h2>
            <span className="font-mono text-body-sm text-text-tertiary">{column.cards.length}</span>
            <button
              type="button"
              onClick={() => {
                setDraft(column.name);
                setEditing(true);
              }}
              aria-label={`Rename ${column.name}`}
              className="text-text-tertiary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <ul className="flex flex-col gap-grid">
        {column.cards.map((p) => (
          <li key={p.slug} className="flex flex-col gap-1.5">
            <SavedCard problem={p} />
            <div className="flex items-center gap-2 px-1 text-body-sm text-text-secondary">
              <label className="flex items-center gap-1">
                <span className="text-text-tertiary">Move to</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onMoveCard(p.slug, e.target.value);
                  }}
                  aria-label={`Move ${p.title} to another collection`}
                  className="rounded-button border border-border-default bg-surface-card px-1.5 py-0.5 text-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                >
                  <option value="">choose…</option>
                  {others.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => onRemoveCard(p.slug)}
                aria-label={`Remove ${p.title} from saved`}
                className="ml-auto inline-flex items-center gap-1 text-text-tertiary hover:text-status-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
              >
                <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <label className="mt-grid flex items-center gap-2 px-1 text-body-sm text-text-secondary">
        <span className="text-text-tertiary">+ Add problem</span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onAddProblem(e.target.value);
          }}
          aria-label={`Add a problem to ${column.name}`}
          disabled={addable.length === 0}
          className="min-w-0 flex-1 rounded-button border border-border-default bg-surface-card px-1.5 py-1 text-body-sm text-text-primary disabled:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          <option value="">{addable.length === 0 ? "nothing to add" : "choose a problem…"}</option>
          {addable.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
