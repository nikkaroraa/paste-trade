import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowButton } from "@/components/authors/follow-button";
import { getAuthors, getFollowedAuthorIds, getTradesForFollowedAuthors } from "@/lib/db";
import { pct, relativeTime } from "@/components/common/format";

export default async function FollowingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [trades, authors, followedAuthorIds] = await Promise.all([
    getTradesForFollowedAuthors(session.user.id),
    getAuthors(),
    getFollowedAuthorIds(session.user.id),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Following</h1>
        <p className="text-sm text-zinc-400">Trades from authors you follow. No more hunting through the noise.</p>
      </div>
      {!trades.length ? (
        <Card className="border-zinc-800 bg-zinc-900"><CardContent className="p-6 text-sm text-zinc-300">You are not following anyone yet. Fix that on the leaderboard.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {trades.map((trade) => {
            const author = authorMap.get(trade.author_id);
            if (!author) return null;
            return (
              <Card key={trade.id} className="border-zinc-800 bg-zinc-900">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{trade.ticker} <span className="ml-2 text-sm text-zinc-500">{trade.direction}</span></CardTitle>
                    <p className="mt-1 text-sm text-zinc-400">@{author.handle} · {relativeTime(trade.posted_at)}</p>
                  </div>
                  <FollowButton authorId={author.id} initialFollowing={followedAuthorIds.includes(author.id)} />
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-300">
                  <p>{trade.thesis || "No thesis"}</p>
                  <div className="font-mono">P&L {pct(trade.pnl_percent)}</div>
                  <Link href={`/trade/${trade.id}`} className="text-emerald-400 hover:text-emerald-300">Open trade</Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
