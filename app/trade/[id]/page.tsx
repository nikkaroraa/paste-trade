import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthorById, getSnapshotsByTradeId, getTradeById, getTrades } from "@/lib/db";
import { pct, usd } from "@/components/common/format";
import { PnlChart } from "@/components/common/pnl-chart";

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trade = await getTradeById(id);
  if (!trade) return notFound();

  const [author, snapshots, related] = await Promise.all([
    getAuthorById(trade.author_id),
    getSnapshotsByTradeId(trade.id),
    getTrades().then((list) => list.filter((t) => t.ticker === trade.ticker && t.id !== trade.id).slice(0, 6)),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Trade Detail</h1>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trade.ticker}
            <Badge variant="secondary">{trade.direction}</Badge>
            <Badge variant="secondary">{trade.asset_type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>{trade.thesis}</p>
          <p className="font-mono">Entry {usd(trade.entry_price)} · Current {usd(trade.current_price)} · P&L {pct(trade.pnl_percent)}</p>
          <p>Author: {author?.handle || "unknown"}</p>
          {trade.source_url ? (
            <Link href={trade.source_url} target="_blank" className="text-emerald-400 hover:text-emerald-300">
              Open original source
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {snapshots.length ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>P&L history</CardTitle></CardHeader>
          <CardContent>
            <PnlChart data={snapshots.map((s) => ({ t: new Date(s.snapshot_at).toLocaleDateString(), pnl: s.pnl_percent ?? 0 }))} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle>Related trades</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {related.map((r) => (
            <Link key={r.id} href={`/trade/${r.id}`} className="block rounded border border-zinc-800 p-2 hover:border-zinc-700">
              {r.ticker} · {r.direction} · {pct(r.pnl_percent)}
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
