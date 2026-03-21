import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarkets } from "@/lib/db";

export default async function MarketsPage() {
  const markets = await getMarkets();
  const sorted = [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Prediction Markets</h1>
      <div className="flex gap-2 text-xs">
        <Badge variant="secondary">Category: All</Badge>
        <Badge variant="secondary">Sort: Volume</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((m) => (
          <Card key={m.id} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-zinc-400">
              <p>Category: {m.category || "unknown"}</p>
              <p className="font-mono text-zinc-200">Odds: {((m.current_odds ?? 0) * 100).toFixed(2)}%</p>
              <p className="font-mono">Volume: ${(m.volume ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
