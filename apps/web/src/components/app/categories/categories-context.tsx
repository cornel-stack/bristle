"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shell-level ephemeral categories (slice 4.9). The cross-route evolution of the
// per-page ephemeral write model (4.5/4.6) — warranted here because the DoD needs
// the new category visible across the sidebar (shell), the alert filter (/app/
// alerts), and the palette (shell), same session. Seeded from the server on load;
// addCategory appends an ephemeral custom one; reload re-seeds from the server —
// so the custom category vanishes. NO DB write, NO localStorage. Tier 5.5 swaps
// this for a real insert (is_custom + created_by_user_id) + a server-fetched list
// (TF-028).
export interface CategoryItem {
  key: string;
  label: string;
  count: number;
  watched: boolean;
  isCustom: boolean;
  sources?: string[];
  keywords?: string;
}

interface CategoriesContextValue {
  categories: CategoryItem[];
  addCategory: (input: { name: string; keywords: string; sources: string[] }) => void;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

export function CategoriesProvider({
  seed,
  children,
}: {
  seed: CategoryItem[];
  children: ReactNode;
}) {
  const [categories, setCategories] = useState<CategoryItem[]>(seed);

  function addCategory({
    name,
    keywords,
    sources,
  }: {
    name: string;
    keywords: string;
    sources: string[];
  }) {
    setCategories((cur) => {
      const base = slugify(name);
      const existing = new Set(cur.map((c) => c.key));
      let key = base;
      let n = 2;
      while (existing.has(key)) key = `${base}-${n++}`;
      return [
        ...cur,
        { key, label: name.trim(), count: 0, watched: true, isCustom: true, sources, keywords },
      ];
    });
  }

  return (
    <CategoriesContext.Provider value={{ categories, addCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
