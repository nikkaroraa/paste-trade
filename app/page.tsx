import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAuthors, getTrades } from "@/lib/db";
import { pct } from "@/components/common/format";

export default async function LeaderboardPage() {
  const [authors, trades] = await Promise.all([getAuthors(), getTrades()]);
  const ranked = [...authors].sort((a, b) => b.avg_pnl - a.avg_pnl);
  const topPnl = ranked[0]?.best_trade_pnl ?? 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receipts for trade calls</h1>
        <p className="text-sm text-zinc-400">Leaderboard of who is actually profitable.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total Trades", trades.length],
          ["Active", trades.filter((t) => t.status === "open").length],
          ["Avg Win Rate", `${(authors.reduce((a, b) => a + b.win_rate, 0) / (authors.length || 1)).toFixed(1)}%`],
          ["Top P&L", pct(topPnl)],
        ].map(([label, value]) => (
          <Card key={String(label)} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-400">{label}</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-lg">{String(value)}</CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">Timeframe: All</Badge>
        <Badge variant="secondary">Asset: All</Badge>
        <Badge variant="secondary">Source: All</Badge>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Trades</TableHead>
              <TableHead>Win Rate</TableHead>
              <TableHead>Avg P&L</TableHead>
              <TableHead>Best</TableHead>
              <TableHead>Worst</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((a, i) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono">{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/author/${a.id}`} className="inline-flex items-center gap-1 hover:text-emerald-400">
                    {a.handle} <ArrowUpRight className="size-3" />
                  </Link>
                </TableCell>
                <TableCell>{a.platform}</TableCell>
                <TableCell className="font-mono">{a.total_trades}</TableCell>
                <TableCell className="font-mono">{a.win_rate.toFixed(1)}%</TableCell>
                <TableCell className={`font-mono ${a.avg_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(a.avg_pnl)}</TableCell>
                <TableCell className="font-mono text-emerald-400">{pct(a.best_trade_pnl)}</TableCell>
                <TableCell className="font-mono text-red-400">{pct(a.worst_trade_pnl)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
