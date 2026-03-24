import type { Metadata } from "next";
import { auth } from "@/auth";
import { FeedClient } from "@/components/feed/feed-client";
import { getAuthors, getFollowedAuthorIds, getTrades, getWatchedTradeIds } from "@/lib/db";

export const metadata: Metadata = {
  title: "Live Feed | paste.trade",
};

export default async function FeedPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const [trades, authors, watchedTradeIds, followedAuthorIds] = await Promise.all([
    getTrades(),
    getAuthors(),
    userId ? getWatchedTradeIds(userId) : Promise.resolve([]),
    userId ? getFollowedAuthorIds(userId) : Promise.resolve([]),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Live Feed</h1>
      <FeedClient
        initialTrades={trades}
        authors={authors}
        watchedTradeIds={watchedTradeIds}
        followedAuthorIds={followedAuthorIds}
        loggedIn={Boolean(userId)}
      />
    </section>
  );
}
