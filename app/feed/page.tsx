import type { Metadata } from "next";
import { getAuthors, getTrades } from "@/lib/db";
import { FeedClient } from "@/components/feed/feed-client";

export const metadata: Metadata = {
  title: "Live Feed | paste.trade",
};

export default async function FeedPage() {
  const [trades, authors] = await Promise.all([getTrades(), getAuthors()]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Live Feed</h1>
      <FeedClient initialTrades={trades} authors={authors} />
    </section>
  );
}
