"use client";

// The five primary nav links (client island — active state from the pathname).
// The only nav interactivity in the shell; everything else in the sidebar is a
// Server Component. §4 tokens, lucide 1.5px (20px in navigation, §4.6).
import { Bell, Bookmark, Columns3, LayoutGrid, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/app", icon: LayoutGrid },
  { label: "Library", href: "/app/library", icon: Library },
  { label: "Saved", href: "/app/saved", icon: Bookmark },
  { label: "Alerts", href: "/app/alerts", icon: Bell },
  { label: "Compare", href: "/app/compare", icon: Columns3 },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-tight">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-snug rounded-button px-snug py-2 text-body-md transition-colors ${
              active
                ? "bg-surface-raised font-medium text-text-primary"
                : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
