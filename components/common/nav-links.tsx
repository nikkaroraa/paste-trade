"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/feed", label: "Live Feed" },
  { href: "/markets", label: "Markets" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/following", label: "Following" },
  { href: "/submit", label: "Submit" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href} className={`rounded-md px-2 py-1 transition-colors ${active ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-100"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
