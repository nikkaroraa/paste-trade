"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Author } from "@/lib/types";
import { pct, relativeTime } from "@/components/common/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/authors/follow-button";

type Key = "handle" | "platform" | "total_trades" | "win_rate" | "avg_pnl" | "best_trade_pnl" | "worst_trade_pnl";

export function LeaderboardTable({ authors, lastScrapedAt, followedAuthorIds, loggedIn }: { authors: Author[]; lastScrapedAt?: string; followedAuthorIds: string[]; loggedIn: boolean }) {
  const [sortKey, setSortKey] = useState<Key>("avg_pnl");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const next = [...authors].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv);
      return Number(av) - Number(bv);
    });
    return dir === "asc" ? next : next.reverse();
  }, [authors, sortKey, dir]);

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const rows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const head = (label: string, key: Key) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
          else {
            setSortKey(key);
            setDir("desc");
          }
        }}
        className="h-8 px-1 text-zinc-300"
      >
        {label} <ArrowUpDown className="ml-1 size-3" />
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-400">Last scraped: {relativeTime(lastScrapedAt)}</div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              {head("Author", "handle")}
              {head("Platform", "platform")}
              {head("Trades", "total_trades")}
              {head("Win Rate", "win_rate")}
              {head("Avg P&L", "avg_pnl")}
              {head("Best", "best_trade_pnl")}
              {head("Worst", "worst_trade_pnl")}
              <TableHead>Follow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a, i) => (
              <TableRow key={a.id} className="transition-colors hover:bg-zinc-800/40">
                <TableCell className="font-mono">{(page - 1) * pageSize + i + 1}</TableCell>
                <TableCell>
                  <Link href={`/author/${a.id}`} className="hover:text-emerald-400">@{a.handle}</Link>
                </TableCell>
                <TableCell>{a.platform}</TableCell>
                <TableCell className="font-mono">{a.total_trades}</TableCell>
                <TableCell className={`font-mono ${a.win_rate >= 50 ? "text-emerald-400" : "text-amber-400"}`}>{a.win_rate.toFixed(1)}%</TableCell>
                <TableCell className={`font-mono ${a.avg_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(a.avg_pnl)}</TableCell>
                <TableCell className="font-mono text-emerald-400">{pct(a.best_trade_pnl)}</TableCell>
                <TableCell className="font-mono text-red-400">{pct(a.worst_trade_pnl)}</TableCell>
                <TableCell><FollowButton authorId={a.id} initialFollowing={followedAuthorIds.includes(a.id)} disabled={!loggedIn} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-zinc-400">{page}/{totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
