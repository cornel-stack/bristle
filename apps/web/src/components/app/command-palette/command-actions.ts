import type { CommandIndexCategory } from "@bristle/db";

// The contextual Actions group — genuine NAVIGATIONS (the palette is a launcher,
// never a fake write — A2/A4). "Save"/"Create alert" route to the screen that
// owns that action.
export interface CommandAction {
  id: string;
  label: string;
  hint: string;
  target: string;
}

export function buildActions(query: string, categories: CommandIndexCategory[]): CommandAction[] {
  const q = query.trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  const actions: CommandAction[] = [
    {
      id: "search-library",
      label: `Search the Library for “${q}”`,
      hint: "Navigate",
      target: `/app/library?q=${encodeURIComponent(q)}`,
    },
  ];
  const cat = categories.find((c) => c.label.toLowerCase().includes(lower));
  if (cat) {
    actions.push({
      id: "open-category",
      label: `Open Library filtered to ${cat.label}`,
      hint: "Navigate",
      target: `/app/library?category=${cat.key}`,
    });
  }
  actions.push({
    id: "create-alert",
    label: "Create an alert",
    hint: "Watch rule",
    target: "/app/alerts",
  });
  return actions;
}
