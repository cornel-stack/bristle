"use client";

import type { Problem, SavedBoardColumn } from "@bristle/db";
import { useState } from "react";

import { dotClass } from "./collection-color";
import { SavedHeader } from "./saved-header";

// The Saved Kanban board (the single client island). EPHEMERAL write model
// (slice 4.5, A1): the board hydrates ONCE from the server `initial` into local
// state; every interaction mutates this state only — no DB write, no storage —
// so a reload resets to the seeded baseline. Tier 5.5 swaps these transitions for
// real per-user server actions (TF-028). Batch 0 renders read-only columns;
// Batch A adds the card/column components, Batch B the interactions.
export interface BoardColumn {
  id: string;
  name: string;
  color: string | null;
  cards: Problem[];
}

function hydrate(initial: SavedBoardColumn[]): BoardColumn[] {
  return initial.map((c) => ({
    id: c.collection.id,
    name: c.collection.name,
    color: c.collection.color,
    cards: c.problems,
  }));
}

export function SavedBoard({
  initial,
  savedUsed,
  savedQuota,
}: {
  initial: SavedBoardColumn[];
  savedUsed: number;
  savedQuota: number | null;
}) {
  const [columns] = useState<BoardColumn[]>(() => hydrate(initial));

  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <SavedHeader
        savedUsed={savedUsed}
        savedQuota={savedQuota}
        collectionCount={columns.length}
      />
      <div className="mt-section flex gap-grid overflow-x-auto pb-grid">
        {columns.map((col) => (
          <section key={col.id} className="w-72 shrink-0">
            <div className="flex items-center gap-2 px-1 pb-grid">
              <span className={`size-2.5 rounded-pill ${dotClass(col.color)}`} aria-hidden="true" />
              <h2 className="text-body-md font-medium text-text-primary">{col.name}</h2>
              <span className="font-mono text-body-sm text-text-tertiary">{col.cards.length}</span>
            </div>
            <ul className="flex flex-col gap-grid">
              {col.cards.map((p) => (
                <li key={p.slug} className="text-body-sm text-text-secondary">
                  {p.title}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
