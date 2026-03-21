const SUBS = ["wallstreetbets", "CryptoCurrency", "ethtrader", "defi", "options", "stocks"];

export interface RedditPost {
  title: string;
  selftext: string;
  author: string;
  url: string;
  score: number;
  created_utc: number;
  id: string;
  subreddit: string;
}

export async function scrapeReddit(): Promise<RedditPost[]> {
  const out: RedditPost[] = [];

  for (const sub of SUBS) {
    try {
      const res = await fetch(`https://reddit.com/r/${sub}/hot.json?limit=20`, {
        headers: { "User-Agent": "paste-trade-mvp/1.0" },
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const children = json?.data?.children ?? [];

      for (const item of children) {
        const data = item?.data;
        if (!data) continue;
        out.push({
          title: data.title ?? "",
          selftext: data.selftext ?? "",
          author: data.author ?? "unknown",
          url: data.url ?? "",
          score: data.score ?? 0,
          created_utc: data.created_utc ?? Math.floor(Date.now() / 1000),
          id: data.id,
          subreddit: sub,
        });
      }
    } catch {
      continue;
    }
  }

  return out;
}
