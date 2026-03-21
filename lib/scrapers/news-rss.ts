import Parser from "rss-parser";

const feeds = [
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss",
  "https://thedefiant.io/feed",
  "https://blockworks.co/feed",
  "https://decrypt.co/feed",
];

export interface NewsItem {
  title: string;
  contentSnippet?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  source: string;
}

export async function scrapeNewsRss(): Promise<NewsItem[]> {
  const parser = new Parser();
  const items: NewsItem[] = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed);
      const source = new URL(feed).hostname;
      for (const item of parsed.items.slice(0, 20)) {
        items.push({
          title: item.title ?? "",
          contentSnippet: item.contentSnippet,
          link: item.link,
          pubDate: item.pubDate,
          creator: item.creator,
          source,
        });
      }
    } catch {
      continue;
    }
  }

  return items;
}
