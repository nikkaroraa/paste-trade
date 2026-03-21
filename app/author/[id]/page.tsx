import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthorById, getTrades } from "@/lib/db";
import { pct } from "@/components/common/format";

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) return notFound();
  const trades = (await getTrades()).filter((t) => t.author_id === id);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">@{author.handle}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total", author.total_trades],
          ["Win Rate", `${author.win_rate.toFixed(1)}%`],
          ["Avg P&L", pct(author.avg_pnl)],
          ["Streak", `${author.win_count}W / ${author.loss_count}L`],
        ].map(([label, value]) => (
          <Card key={String(label)} className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-zinc-400">{label}</CardTitle></CardHeader>
            <CardContent className="font-mono">{String(value)}</CardContent>
          </Card>
        ))}
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
