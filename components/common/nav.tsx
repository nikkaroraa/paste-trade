"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/feed", label: "Live Feed" },
  { href: "/markets", label: "Markets" },
  { href: "/submit", label: "Submit" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight text-zinc-100">
          paste.trade
        </Link>
        <nav className="flex items-center gap-2 text-sm text-zinc-400">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={`rounded-md px-2 py-1 transition-colors ${active ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-100"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
