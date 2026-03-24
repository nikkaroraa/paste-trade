import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthors, getWatchlistTrades } from "@/lib/db";
import { pct, usd } from "@/components/common/format";
import { WatchButton } from "@/components/trades/watch-button";
import Link from "next/link";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [trades, authors] = await Promise.all([getWatchlistTrades(session.user.id), getAuthors()]);
  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-sm text-zinc-400">Saved trades with live P&L. Finally, receipts with memory.</p>
      </div>
      {!trades.length ? (
        <Card className="border-zinc-800 bg-zinc-900"><CardContent className="p-6 text-sm text-zinc-300">Nothing watched yet. Go bookmark some trades.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {trades.map((trade) => (
            <Card key={trade.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{trade.ticker}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-400">@{authorMap.get(trade.author_id)?.handle ?? "unknown"} · {trade.direction}</p>
                </div>
                <WatchButton tradeId={trade.id} initialWatched={true} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-300">
                <p>{trade.thesis || "No thesis"}</p>
                <div className="font-mono text-zinc-400">Entry {usd(trade.entry_price)} · Current {usd(trade.current_price)} · P&L {pct(trade.pnl_percent)}</div>
                <Link href={`/trade/${trade.id}`} className="text-emerald-400 hover:text-emerald-300">Open trade</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
