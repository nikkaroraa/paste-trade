import type { Metadata } from "next";
import { Activity, Percent, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthors, getTrades } from "@/lib/db";
import { pct, relativeTime } from "@/components/common/format";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { RefreshDataButton } from "@/components/common/refresh-data-button";

export const metadata: Metadata = {
  title: "Leaderboard | paste.trade",
};

export default async function LeaderboardPage() {
  const [authors, trades] = await Promise.all([getAuthors(), getTrades()]);
  const topPnl = Math.max(...authors.map((a) => a.best_trade_pnl), 0);
  const lastScrapedAt = trades[0]?.created_at;

  return (
    <section className="space-y-8">
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Badge variant="secondary" className="w-fit">Live leaderboard</Badge>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Receipts for trade calls</h1>
          <p className="text-sm text-zinc-400">Track who actually makes money, not who tweets the loudest.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <RefreshDataButton />
          <span className="text-xs text-zinc-500">Last scraped: {relativeTime(lastScrapedAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total Trades", trades.length, <Activity key="a" className="size-4" />],
          ["Active", trades.filter((t) => t.status === "open").length, <TrendingUp key="b" className="size-4" />],
          ["Avg Win Rate", `${(authors.reduce((a, b) => a + b.win_rate, 0) / (authors.length || 1)).toFixed(1)}%`, <Percent key="c" className="size-4" />],
          ["Top P&L", pct(topPnl), <Trophy key="d" className="size-4" />],
        ].map(([label, value, icon]) => (
          <Card key={String(label)} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-xs text-zinc-400">{icon} {label}</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-2xl">{String(value)}</CardContent>
          </Card>
        ))}
      </div>

      {!authors.length ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6 text-sm text-zinc-300">
            <p className="font-semibold">No leaderboard data yet.</p>
            <p className="mt-1 text-zinc-400">Run your first scrape with the Refresh Data button above.</p>
          </CardContent>
        </Card>
      ) : (
        <LeaderboardTable authors={authors} lastScrapedAt={lastScrapedAt} />
      )}
    </section>
  );
}
