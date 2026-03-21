import type { Metadata } from "next";
import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compactUsd } from "@/components/common/format";
import { getMarkets } from "@/lib/db";

const barWidth = (odds: number) => {
  const pct = Math.round(odds * 100);
  if (pct >= 100) return "w-full";
  if (pct >= 90) return "w-11/12";
  if (pct >= 80) return "w-10/12";
  if (pct >= 70) return "w-9/12";
  if (pct >= 60) return "w-8/12";
  if (pct >= 50) return "w-7/12";
  if (pct >= 40) return "w-6/12";
  if (pct >= 30) return "w-5/12";
  if (pct >= 20) return "w-4/12";
  if (pct >= 10) return "w-3/12";
  return "w-2/12";
};

export const metadata: Metadata = {
  title: "Markets | paste.trade",
};

export default async function MarketsPage() {
  const markets = await getMarkets();
  const sorted = [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const hot = sorted.slice(0, 3);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Prediction Markets</h1>
      <div className="flex flex-wrap gap-2 text-xs">
        {["All", "Politics", "Crypto", "Sports"].map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Flame className="size-4 text-emerald-400" /> Hot markets</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {hot.map((m) => <Link href={`https://polymarket.com/event/${m.market_id}`} target="_blank" key={m.id} className="rounded-md border border-zinc-800 p-3 text-xs hover:border-zinc-700">{m.title}</Link>)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((m) => (
          <Link href={`https://polymarket.com/event/${m.market_id}`} target="_blank" key={m.id}>
            <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{m.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-zinc-400">
                <p>Category: {m.category || "unknown"}</p>
                <div>
                  <div className="mb-1 flex justify-between font-mono text-zinc-200"><span>Odds</span><span>{((m.current_odds ?? 0) * 100).toFixed(1)}%</span></div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div className={`h-2 rounded-full ${(m.current_odds ?? 0) >= 0.5 ? "bg-emerald-500" : "bg-amber-500"} ${barWidth(m.current_odds ?? 0)}`} />
                  </div>
                </div>
                <p className="font-mono">Volume: {compactUsd(m.volume)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
