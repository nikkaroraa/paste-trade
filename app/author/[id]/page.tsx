import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Trophy, TrendingUp, UserCircle2, Users } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FollowButton } from "@/components/authors/follow-button";
import { getAuthorById, getFollowedAuthorIds, getFollowerCount, getTrades } from "@/lib/db";
import { pct } from "@/components/common/format";

export const metadata: Metadata = { title: "Author Profile | paste.trade" };

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const author = await getAuthorById(id);
  if (!author) return notFound();
  const [trades, followerCount, followedAuthorIds] = await Promise.all([
    getTrades().then((list) => list.filter((t) => t.author_id === id)),
    getFollowerCount(id),
    userId ? getFollowedAuthorIds(userId) : Promise.resolve([]),
  ]);
  const best = [...trades].sort((a, b) => (b.pnl_percent ?? 0) - (a.pnl_percent ?? 0))[0];
  const worst = [...trades].sort((a, b) => (a.pnl_percent ?? 0) - (b.pnl_percent ?? 0))[0];
  const initials = author.handle.slice(0, 2).toUpperCase();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">{initials}</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">@{author.handle}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400"><Users className="size-4" /> {followerCount} followers</p>
          </div>
        </div>
        <FollowButton authorId={author.id} initialFollowing={followedAuthorIds.includes(author.id)} disabled={!userId} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total", author.total_trades, <BarChart3 key="a" className="size-4" />],
          ["Win Rate", `${author.win_rate.toFixed(1)}%`, <TrendingUp key="b" className="size-4" />],
          ["Avg P&L", pct(author.avg_pnl), <Trophy key="c" className="size-4" />],
          ["Streak", `${author.win_count}W / ${author.loss_count}L`, <UserCircle2 key="d" className="size-4" />],
        ].map(([label, value, icon]) => (
          <Card key={String(label)} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xs text-zinc-400">{icon}{label}</CardTitle></CardHeader>
            <CardContent className="font-mono">{String(value)}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900"><CardHeader><CardTitle className="text-sm">Best trade</CardTitle></CardHeader><CardContent className="text-sm">{best ? `${best.ticker} ${pct(best.pnl_percent)}` : "None"}</CardContent></Card>
        <Card className="border-zinc-800 bg-zinc-900"><CardHeader><CardTitle className="text-sm">Worst trade</CardTitle></CardHeader><CardContent className="text-sm">{worst ? `${worst.ticker} ${pct(worst.pnl_percent)}` : "None"}</CardContent></Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle>Trade History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead><TableHead>Direction</TableHead><TableHead>Status</TableHead><TableHead>P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Link href={`/trade/${t.id}`}>{t.ticker}</Link></TableCell>
                  <TableCell>{t.direction}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell className={`font-mono ${(t.pnl_percent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(t.pnl_percent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
