"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AddCategoryModal } from "./add-category-modal";

// The dashboard "+ Add category" button — opens the modal (client open-state).
export function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-tight rounded-button bg-accent-bristle px-snug py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Add category
      </button>
      {open ? <AddCategoryModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
