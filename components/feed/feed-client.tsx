"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Newspaper, Radio, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pnlColor, pct, relativeTime, truncate, usd } from "@/components/common/format";
import { Author, Trade } from "@/lib/types";

const PAGE_SIZE = 20;

export function FeedClient({ initialTrades, authors }: { initialTrades: Trade[]; authors: Author[] }) {
  const [trades, setTrades] = useState(initialTrades);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hasNew, setHasNew] = useState(false);

  const authorMap = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);

  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch("/api/trades", { cache: "no-store" });
      const json = await res.json();
      if (json?.trades?.[0]?.id && json.trades[0].id !== trades[0]?.id) {
        setHasNew(true);
      }
    }, 60_000);
    return () => clearInterval(poll);
  }, [trades]);

  useEffect(() => {
    const pricePoll = setInterval(() => {
      fetch("/api/prices").catch(() => undefined);
    }, 300_000);
    return () => clearInterval(pricePoll);
  }, []);

  const filtered = trades.filter((t) => {
    const hay = `${t.ticker} ${t.thesis ?? ""} ${t.source}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const showNew = async () => {
    const res = await fetch("/api/trades", { cache: "no-store" });
    const json = await res.json();
    setTrades(json.trades ?? []);
    setHasNew(false);
  };

  if (!trades.length) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-6 text-sm text-zinc-300">No trades yet. Run a scrape or submit your first trade.</CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticker, source, thesis" className="sm:max-w-xs" />
        {hasNew ? (
          <Button onClick={showNew} variant="outline" className="border-emerald-500/40 text-emerald-400">
            <RefreshCcw className="mr-2 size-4" /> New trades available
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.slice(0, visible).map((trade) => {
          const isOpen = expanded[trade.id];
          const sourceIcon = trade.source === "reddit" ? <Radio className="size-3" /> : <Newspaper className="size-3" />;
          return (
            <Card key={trade.id} className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    {trade.ticker}
                    <span className={`ml-2 rounded px-2 py-0.5 text-xs ${trade.direction === "long" || trade.direction === "yes" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </CardTitle>
                  <span className={`font-mono text-xl ${pnlColor(trade.pnl_percent)}`}>{pct(trade.pnl_percent)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-mono text-zinc-300">Entry {usd(trade.entry_price)} · Current {usd(trade.current_price)}</div>
                <p className="text-zinc-300">
                  {isOpen ? trade.thesis : truncate(trade.thesis, 300)}
                  {(trade.thesis?.length ?? 0) > 300 ? (
                    <button className="ml-2 inline-flex items-center text-emerald-400" onClick={() => setExpanded((p) => ({ ...p, [trade.id]: !isOpen }))}>
                      {isOpen ? "show less" : "read more"} <ChevronDown className={`ml-1 size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <Badge variant="secondary">{trade.confidence || "low"}</Badge>
                  <Badge variant="secondary">{trade.timeframe || "unknown"}</Badge>
                  <span className="inline-flex items-center gap-1">{sourceIcon} {trade.source}</span>
                  <span>@{authorMap.get(trade.author_id)?.handle || "unknown"}</span>
                  <span title={trade.posted_at}>{relativeTime(trade.posted_at)}</span>
                </div>
                <Link href={`/trade/${trade.id}`} className="text-xs text-emerald-400 hover:text-emerald-300">
                  Open detail page
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visible < filtered.length ? (
        <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="w-full border-zinc-700">
          Load more
        </Button>
      ) : null}
    </section>
  );
}
