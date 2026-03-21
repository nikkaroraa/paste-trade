import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthorById, getSnapshotsByTradeId, getTradeById, getTrades } from "@/lib/db";
import { pct, usd, pnlColor, truncate } from "@/components/common/format";
import { PnlChart } from "@/components/common/pnl-chart";

export const metadata: Metadata = { title: "Trade Detail | paste.trade" };

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trade = await getTradeById(id);
  if (!trade) return notFound();

  const [author, snapshots, related] = await Promise.all([
    getAuthorById(trade.author_id),
    getSnapshotsByTradeId(trade.id),
    getTrades().then((list) => list.filter((t) => t.ticker === trade.ticker && t.id !== trade.id).slice(0, 4)),
  ]);

  const catalysts = (trade.thesis ?? "").split(".").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  return (
    <section className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">{trade.ticker} <Badge variant="secondary">{trade.direction}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-zinc-800 p-3"><div className="text-xs text-zinc-400">Entry price</div><div className="font-mono text-lg">{usd(trade.entry_price)}</div></div>
            <div className="rounded-md border border-zinc-800 p-3"><div className="text-xs text-zinc-400">Current price</div><div className="font-mono text-lg">{usd(trade.current_price)}</div></div>
            <div className="rounded-md border border-zinc-800 p-3"><div className="text-xs text-zinc-400">P&L</div><div className={`font-mono text-lg ${pnlColor(trade.pnl_percent)}`}>{pct(trade.pnl_percent)}</div></div>
          </div>
          <blockquote className="rounded-md border-l-2 border-emerald-500 bg-zinc-950 p-3 text-zinc-200">{trade.thesis || "No thesis"}</blockquote>
          <div className="flex flex-wrap gap-2">{catalysts.map((c) => <Badge key={c} variant="secondary">{truncate(c, 40)}</Badge>)}</div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200"><AlertTriangle className="mr-2 inline size-4" /> Risks: market volatility, execution slippage, thesis invalidation.</div>
          <div className="flex gap-2">
            {trade.source_url ? <Link href={trade.source_url} target="_blank"><Button className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500"><ExternalLink className="mr-2 size-4" />View Original Source</Button></Link> : null}
            <Button variant="outline" className="border-zinc-700" disabled><Copy className="mr-2 size-4" />Share link</Button>
          </div>
          <p className="text-xs text-zinc-400">Author: @{author?.handle || "unknown"}</p>
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
        <CardHeader><CardTitle>Similar Trades</CardTitle></CardHeader>
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
