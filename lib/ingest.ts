import { extractTrade } from "./ai/extract-trade";
import { getCoinGeckoPrices, tickerToCoinId } from "./prices/coingecko";
import { upsertAuthor, upsertMarket, upsertTrade, getTrades, saveSnapshot, recomputeAuthorStats } from "./db";
import { scrapeDefiLlamaSignals } from "./scrapers/defi-llama";
import { scrapeNewsRss } from "./scrapers/news-rss";
import { scrapePolymarket } from "./scrapers/polymarket";
import { scrapeReddit } from "./scrapers/reddit";

export async function runFullScrape() {
  const reddit = await scrapeReddit();
  const news = await scrapeNewsRss();
  const markets = await scrapePolymarket();
  const llama = await scrapeDefiLlamaSignals();

  let inserted = 0;

  for (const post of reddit) {
    const ext = await extractTrade(`${post.title}\n\n${post.selftext}`);
    if (!ext.has_trade) continue;

    const author = await upsertAuthor({ handle: post.author, platform: "reddit" });
    await upsertTrade({
      author_id: author.id,
      source: "reddit",
      source_url: post.url,
      source_post_id: `reddit_${post.id}`,
      ticker: ext.ticker,
      asset_type: ext.asset_type,
      direction: ext.direction,
      thesis: ext.thesis,
      confidence: ext.confidence,
      timeframe: ext.timeframe,
      venue: "spot",
      posted_at: new Date(post.created_utc * 1000).toISOString(),
    });
    inserted += 1;
  }

  for (const item of news) {
    const ext = await extractTrade(`${item.title}\n\n${item.contentSnippet ?? ""}`);
    if (!ext.has_trade) continue;
    const author = await upsertAuthor({ handle: item.source, platform: "twitter" });
    await upsertTrade({
      author_id: author.id,
      source: "news",
      source_url: item.link,
      source_post_id: `news_${item.link}`,
      ticker: ext.ticker,
      asset_type: ext.asset_type,
      direction: ext.direction,
      thesis: ext.thesis,
      confidence: ext.confidence,
      timeframe: ext.timeframe,
      venue: "spot",
      posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
    });
    inserted += 1;
  }

  for (const market of markets) {
    await upsertMarket({
      platform: "polymarket",
      market_id: String(market.id),
      title: market.title,
      category: market.category,
      current_odds: market.outcomes?.[0]?.price,
      volume: market.volume,
      end_date: market.endDate,
      resolved: false,
      resolution: undefined,
    });

    const author = await upsertAuthor({ handle: "polymarket", platform: "polymarket" });
    await upsertTrade({
      author_id: author.id,
      source: "polymarket",
      source_url: `https://polymarket.com/event/${market.id}`,
      source_post_id: `polymarket_${market.id}`,
      ticker: "POLY",
      asset_type: "prediction",
      direction: "yes",
      thesis: market.title,
      confidence: "medium",
      timeframe: "unknown",
      entry_odds: market.outcomes?.[0]?.price,
      current_odds: market.outcomes?.[0]?.price,
      venue: "prediction",
      posted_at: new Date().toISOString(),
    });
  }

  for (const signal of llama) {
    const author = await upsertAuthor({ handle: "defillama", platform: "twitter" });
    await upsertTrade({
      author_id: author.id,
      source: "news",
      source_url: "https://defillama.com",
      source_post_id: `llama_${signal.protocol}`,
      ticker: signal.symbol.toUpperCase(),
      asset_type: "crypto",
      direction: signal.change_1d > 0 ? "long" : "short",
      thesis: signal.reason,
      confidence: "low",
      timeframe: "1d",
      venue: "spot",
      posted_at: new Date().toISOString(),
    });
  }

  await recomputeAuthorStats();

  return { inserted, reddit: reddit.length, news: news.length, markets: markets.length, llama: llama.length };
}

export async function refreshPrices() {
  const trades = await getTrades();
  const openTrades = trades.filter((t) => t.status === "open");
  const tickers = openTrades.map((t) => t.ticker);
  const prices = await getCoinGeckoPrices(tickers);

  let updated = 0;
  for (const trade of openTrades) {
    const id = tickerToCoinId(trade.ticker);
    const usd = id ? prices[id]?.usd : undefined;
    if (!usd) continue;
    const entry = trade.entry_price ?? usd;
    const pnl = entry ? ((usd - entry) / entry) * 100 : 0;
    await upsertTrade({ ...trade, current_price: usd, entry_price: entry, pnl_percent: pnl });
    await saveSnapshot({ trade_id: trade.id, price: usd, pnl_percent: pnl });
    updated += 1;
  }

  await recomputeAuthorStats();
  return { updated };
}
