"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/todos", label: "To-dos" },
  { href: "/archive", label: "Archive" },
  { href: "/plan", label: "FDE Plan" },
  { href: "/logs", label: "Daily Logs" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
        <span className="mr-4 font-semibold">FDE Prep</span>
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent/15 font-medium text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
