import { extractTrade } from "./ai/extract-trade";
import { getCoinGeckoPrices, tickerToCoinId } from "./prices/coingecko";
import { upsertAuthor, upsertMarket, upsertTrade, getTrades, saveSnapshot, recomputeAuthorStats } from "./db";
import { scrapeDefiLlamaSignals } from "./scrapers/defi-llama";
import { scrapeNewsRss } from "./scrapers/news-rss";
import { scrapePolymarket } from "./scrapers/polymarket";
import { scrapeReddit } from "./scrapers/reddit";
import { ExtractedTrade } from "./types";

const REDDIT_KEYWORD_RE = /(\$[A-Z]{2,6}\b|\b(?:buy|sell|long|short|bullish|bearish|calls|puts|swing|entry|target|stop|accumulating)\b)/i;

function buildRedditText(title: string, selftext: string) {
  return `${title}\n\n${selftext}`.trim();
}

function hasTradeSignal(text: string) {
  return REDDIT_KEYWORD_RE.test(text);
}

function calculatePnl(direction: string, entryPrice: number, currentPrice: number) {
  if (!entryPrice) return 0;
  const raw = ((currentPrice - entryPrice) / entryPrice) * 100;
  return direction === "short" ? raw * -1 : raw;
}

async function enrichTradePrice(extracted: ExtractedTrade) {
  const coinId = tickerToCoinId(extracted.ticker);
  if (!coinId) {
    return { entry_price: undefined, current_price: undefined, pnl_percent: undefined };
  }

  const prices = await getCoinGeckoPrices([extracted.ticker]);
  const currentPrice = prices[coinId]?.usd;
  if (!currentPrice) {
    return { entry_price: undefined, current_price: undefined, pnl_percent: undefined };
  }

  return {
    entry_price: currentPrice,
    current_price: currentPrice,
    pnl_percent: 0,
  };
}

export async function runFullScrape() {
  const [reddit, news, markets, llama, existingTrades] = await Promise.all([
    scrapeReddit(),
    scrapeNewsRss(),
    scrapePolymarket(),
    scrapeDefiLlamaSignals(),
    getTrades(),
  ]);

  const seenSourceIds = new Set(existingTrades.map((trade) => trade.source_post_id).filter(Boolean));
  const candidatePosts = reddit.filter((post) => post.score > 10).filter((post) => !seenSourceIds.has(`reddit_${post.id}`));
  const filteredReddit = candidatePosts.filter((post) => hasTradeSignal(buildRedditText(post.title, post.selftext))).slice(0, 20);

  let inserted = 0;

  for (const post of filteredReddit) {
    const ext = await extractTrade(buildRedditText(post.title, post.selftext));
    if (!ext.has_trade || !ext.ticker) continue;

    const author = await upsertAuthor({ handle: post.author, platform: "reddit" });
    const pricing = await enrichTradePrice(ext);
    const trade = await upsertTrade({
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
      venue: ext.asset_type === "prediction" ? "prediction" : "spot",
      posted_at: new Date(post.created_utc * 1000).toISOString(),
      ...pricing,
    });

    if (trade.current_price) {
      await saveSnapshot({ trade_id: trade.id, price: trade.current_price, pnl_percent: trade.pnl_percent ?? 0 });
    }
    inserted += 1;
  }

  for (const item of news) {
    const ext = await extractTrade(`${item.title}\n\n${item.contentSnippet ?? ""}`);
    if (!ext.has_trade || !ext.ticker) continue;
    const author = await upsertAuthor({ handle: item.source, platform: "news" });
    const pricing = await enrichTradePrice(ext);
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
      venue: ext.asset_type === "prediction" ? "prediction" : "spot",
      posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      ...pricing,
    });
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
    const author = await upsertAuthor({ handle: "defillama", platform: "news" });
    const pricing = await enrichTradePrice({
      has_trade: true,
      ticker: signal.symbol.toUpperCase(),
      asset_type: "crypto",
      direction: signal.change_1d > 0 ? "long" : "short",
      thesis: signal.reason,
      confidence: "low",
      timeframe: "1d",
      key_catalysts: [],
      risks: [],
    });

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
      ...pricing,
    });
  }

  await recomputeAuthorStats();

  return {
    inserted,
    reddit: reddit.length,
    redditCandidates: candidatePosts.length,
    redditFiltered: filteredReddit.length,
    news: news.length,
    markets: markets.length,
    llama: llama.length,
  };
}

export async function refreshPrices() {
  const trades = await getTrades();
  const openTrades = trades.filter((trade) => trade.status === "open" && trade.asset_type === "crypto");
  const tickers = Array.from(new Set(openTrades.map((trade) => trade.ticker).filter((ticker) => tickerToCoinId(ticker))));
  const prices = await getCoinGeckoPrices(tickers);

  let updated = 0;
  for (const trade of openTrades) {
    const coinId = tickerToCoinId(trade.ticker);
    const currentPrice = coinId ? prices[coinId]?.usd : undefined;
    if (!currentPrice) continue;
    const entryPrice = trade.entry_price ?? currentPrice;
    const pnl = calculatePnl(trade.direction, entryPrice, currentPrice);
    const updatedTrade = await upsertTrade({ ...trade, current_price: currentPrice, entry_price: entryPrice, pnl_percent: pnl });
    await saveSnapshot({ trade_id: updatedTrade.id, price: currentPrice, pnl_percent: pnl });
    updated += 1;
  }

  await recomputeAuthorStats();
  return { updated, tickers: tickers.length };
}
