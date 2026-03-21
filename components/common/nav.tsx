import Link from "next/link";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/feed", label: "Live Feed" },
  { href: "/markets", label: "Markets" },
  { href: "/submit", label: "Submit" },
];

export function TopNav() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight text-zinc-100">
          paste.trade
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-400">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-zinc-100">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
