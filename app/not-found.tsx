import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-zinc-400">This trade probably got stopped out.</p>
      <Link href="/"><Button>Back to leaderboard</Button></Link>
    </section>
  );
}
