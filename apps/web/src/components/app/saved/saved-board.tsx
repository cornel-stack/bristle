"use client";

import type { Problem, SavedBoardColumn } from "@bristle/db";
import { useMemo, useRef, useState } from "react";

import { SavedColumn } from "./saved-column";
import { SavedHeader } from "./saved-header";

// The Saved Kanban board (the single client island). EPHEMERAL write model
// (slice 4.5, A1): the board hydrates ONCE from the server `initial` into local
// state; every interaction — move / remove / new / rename / add — mutates this
// state only. No DB write, no storage, no server action — so a reload resets to
// the seeded baseline. Tier 5.5 swaps these transitions for real per-user server
// actions (TF-028, the write analogue of the read seam).
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
  allProblems,
  savedUsed,
  savedQuota,
}: {
  initial: SavedBoardColumn[];
  allProblems: Problem[];
  savedUsed: number;
  savedQuota: number | null;
}) {
  const [columns, setColumns] = useState<BoardColumn[]>(() => hydrate(initial));
  const nextId = useRef(0);

  // "+ Add problem" offers problems not saved in ANY column (a problem is saved
  // once — user_saved_problems is unique per (user, problem)). The 6 unsaved of
  // the 15 are addable.
  const addable = useMemo(() => {
    const saved = new Set(columns.flatMap((c) => c.cards.map((p) => p.slug)));
    return allProblems.filter((p) => !saved.has(p.slug));
  }, [columns, allProblems]);

  const allColumns = columns.map((c) => ({ id: c.id, name: c.name }));

  function moveCard(cardSlug: string, toColId: string) {
    setColumns((cols) => {
      const card = cols.flatMap((c) => c.cards).find((p) => p.slug === cardSlug);
      if (!card) return cols;
      return cols.map((c) => {
        if (c.id === toColId) return { ...c, cards: [...c.cards.filter((p) => p.slug !== cardSlug), card] };
        return { ...c, cards: c.cards.filter((p) => p.slug !== cardSlug) };
      });
    });
  }

  function removeCard(cardSlug: string) {
    setColumns((cols) => cols.map((c) => ({ ...c, cards: c.cards.filter((p) => p.slug !== cardSlug) })));
  }

  function renameCollection(colId: string, name: string) {
    setColumns((cols) => cols.map((c) => (c.id === colId ? { ...c, name } : c)));
  }

  function newCollection() {
    setColumns((cols) => [
      ...cols,
      { id: `tmp-${nextId.current++}`, name: "New collection", color: "blue", cards: [] },
    ]);
  }

  function addProblem(colId: string, problemSlug: string) {
    const problem = allProblems.find((p) => p.slug === problemSlug);
    if (!problem) return;
    setColumns((cols) =>
      cols.map((c) => (c.id === colId ? { ...c, cards: [...c.cards, problem] } : c)),
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <SavedHeader
        savedUsed={savedUsed}
        savedQuota={savedQuota}
        collectionCount={columns.length}
        onNewCollection={newCollection}
      />
      <div className="mt-section flex gap-grid overflow-x-auto pb-grid">
        {columns.map((col) => (
          <SavedColumn
            key={col.id}
            column={col}
            allColumns={allColumns}
            addable={addable}
            onMoveCard={moveCard}
            onRemoveCard={removeCard}
            onRename={(name) => renameCollection(col.id, name)}
            onAddProblem={(slug) => addProblem(col.id, slug)}
          />
        ))}
      </div>
    </div>
  );
}
