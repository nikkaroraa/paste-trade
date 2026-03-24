import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { NavLinks } from "@/components/common/nav-links";

export async function TopNav() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-bold tracking-tight text-zinc-100">
            paste.trade
          </Link>
          <div className="lg:hidden">
            <AuthButton />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <NavLinks />
          <div className="hidden lg:block">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
