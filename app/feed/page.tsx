import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthors, getTrades } from "@/lib/db";
import { pct, usd } from "@/components/common/format";

export default async function FeedPage() {
  const [trades, authors] = await Promise.all([getTrades(), getAuthors()]);
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Live Feed</h1>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">Source: All</Badge>
        <Badge variant="secondary">Asset: All</Badge>
        <Badge variant="secondary">Direction: All</Badge>
        <Badge variant="secondary">Confidence: All</Badge>
        <Badge variant="secondary">Sort: Newest</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {trades.map((trade) => {
          const author = authorMap.get(trade.author_id);
          const positive = (trade.pnl_percent ?? 0) >= 0;
          return (
            <Card key={trade.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    <span className={`mr-2 rounded px-2 py-0.5 text-xs ${trade.direction === "long" || trade.direction === "yes" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {trade.direction.toUpperCase()}
                    </span>
                    {trade.ticker}
                  </CardTitle>
                  <span className={`font-mono text-sm ${positive ? "text-emerald-400" : "text-red-400"}`}>{pct(trade.pnl_percent)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-mono text-zinc-300">Entry {usd(trade.entry_price)} · Current {usd(trade.current_price)}</div>
                <p className="line-clamp-3 text-zinc-300">{trade.thesis || "No thesis available"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <Badge variant="secondary">{trade.confidence || "low"}</Badge>
                  <Badge variant="secondary">{trade.timeframe || "unknown"}</Badge>
                  <span>@{author?.handle || "unknown"}</span>
                  <span>{trade.source}</span>
                  <span>{trade.posted_at ? formatDistanceToNow(new Date(trade.posted_at), { addSuffix: true }) : "now"}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  {trade.source_url ? (
                    <Link href={trade.source_url} target="_blank" className="text-emerald-400 hover:text-emerald-300">
                      View Source
                    </Link>
                  ) : null}
                  <Link href={`/trade/${trade.id}`} className="text-zinc-300 hover:text-zinc-100">
                    Open Trade
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
