import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Author, DbShape, FollowedAuthor, Market, PriceSnapshot, Trade, User, WatchlistItem } from "./types";

const dbPath = path.join(process.cwd(), "data", "db.json");

const emptyDb: DbShape = {
  trades: [],
  authors: [],
  users: [],
  watchlist: [],
  followed_authors: [],
  price_snapshots: [],
  markets: [],
};

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return JSON.parse(raw) as DbShape;
  } catch {
    await writeDb(emptyDb);
    return emptyDb;
  }
}

async function writeDb(data: DbShape) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export async function getTrades() {
  const db = await readDb();
  return db.trades;
}

export async function getTradeById(tradeId: string) {
  const db = await readDb();
  return db.trades.find((t) => t.id === tradeId);
}

export async function upsertTrade(input: Partial<Trade> & Pick<Trade, "ticker" | "asset_type" | "direction" | "source">) {
  const db = await readDb();
  const existing = db.trades.find((t) => {
    if (input.source_post_id && t.source_post_id === input.source_post_id) return true;
    if (input.source_url && t.source_url === input.source_url && t.ticker === input.ticker) return true;
    return Boolean(
      input.author_id &&
        t.author_id === input.author_id &&
        t.ticker === input.ticker &&
        t.direction === input.direction &&
        t.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)
    );
  });

  if (existing) {
    const updated = { ...existing, ...input, updated_at: now() } as Trade;
    db.trades = db.trades.map((t) => (t.id === existing.id ? updated : t));
    await writeDb(db);
    return updated;
  }

  const trade: Trade = {
    id: id(),
    author_id: input.author_id ?? "",
    source: input.source,
    source_url: input.source_url,
    source_post_id: input.source_post_id,
    ticker: input.ticker,
    asset_type: input.asset_type,
    direction: input.direction,
    thesis: input.thesis,
    confidence: input.confidence,
    timeframe: input.timeframe,
    entry_price: input.entry_price,
    current_price: input.current_price,
    pnl_percent: input.pnl_percent,
    entry_odds: input.entry_odds,
    current_odds: input.current_odds,
    resolved: input.resolved ?? false,
    resolution: input.resolution,
    venue: input.venue,
    status: input.status ?? "open",
    posted_at: input.posted_at,
    created_at: now(),
    updated_at: now(),
  };

  db.trades.unshift(trade);
  await writeDb(db);
  return trade;
}

export async function upsertAuthor(input: Pick<Author, "handle" | "platform"> & Partial<Author>) {
  const db = await readDb();
  const existing = db.authors.find((a) => a.handle === input.handle && a.platform === input.platform);

  if (existing) {
    const updated = { ...existing, ...input, updated_at: now() } as Author;
    db.authors = db.authors.map((a) => (a.id === existing.id ? updated : a));
    await writeDb(db);
    return updated;
  }

  const author: Author = {
    id: id(),
    handle: input.handle,
    platform: input.platform,
    avatar_url: input.avatar_url,
    total_trades: input.total_trades ?? 0,
    open_trades: input.open_trades ?? 0,
    win_count: input.win_count ?? 0,
    loss_count: input.loss_count ?? 0,
    win_rate: input.win_rate ?? 0,
    avg_pnl: input.avg_pnl ?? 0,
    total_pnl: input.total_pnl ?? 0,
    best_trade_pnl: input.best_trade_pnl ?? 0,
    worst_trade_pnl: input.worst_trade_pnl ?? 0,
    created_at: now(),
    updated_at: now(),
  };

  db.authors.push(author);
  await writeDb(db);
  return author;
}

export async function getAuthors() {
  const db = await readDb();
  return db.authors;
}

export async function getAuthorById(authorId: string) {
  const db = await readDb();
  return db.authors.find((a) => a.id === authorId);
}

export async function saveSnapshot(input: Omit<PriceSnapshot, "id" | "snapshot_at"> & Partial<Pick<PriceSnapshot, "snapshot_at">>) {
  const db = await readDb();
  const snap: PriceSnapshot = {
    id: id(),
    trade_id: input.trade_id,
    price: input.price,
    pnl_percent: input.pnl_percent,
    snapshot_at: input.snapshot_at ?? now(),
  };
  db.price_snapshots.push(snap);
  await writeDb(db);
  return snap;
}

export async function getSnapshotsByTradeId(tradeId: string) {
  const db = await readDb();
  return db.price_snapshots.filter((s) => s.trade_id === tradeId).sort((a, b) => a.snapshot_at.localeCompare(b.snapshot_at));
}

export async function upsertMarket(input: Omit<Market, "id" | "created_at" | "updated_at"> & Partial<Pick<Market, "id">>) {
  const db = await readDb();
  const existing = db.markets.find((m) => m.platform === input.platform && m.market_id === input.market_id);
  if (existing) {
    const updated = { ...existing, ...input, updated_at: now() };
    db.markets = db.markets.map((m) => (m.id === existing.id ? updated : m));
    await writeDb(db);
    return updated;
  }

  const market: Market = {
    id: id(),
    created_at: now(),
    updated_at: now(),
    ...input,
  };
  db.markets.unshift(market);
  await writeDb(db);
  return market;
}

export async function getMarkets() {
  const db = await readDb();
  return db.markets;
}

export async function recomputeAuthorStats() {
  const db = await readDb();

  db.authors = db.authors.map((author) => {
    const trades = db.trades.filter((t) => t.author_id === author.id);
    const pnlValues = trades.map((t) => t.pnl_percent ?? 0);
    const wins = pnlValues.filter((n) => n > 0).length;
    const losses = pnlValues.filter((n) => n < 0).length;
    const totalPnl = pnlValues.reduce((a, b) => a + b, 0);
    const avgPnl = trades.length ? totalPnl / trades.length : 0;

    return {
      ...author,
      total_trades: trades.length,
      open_trades: trades.filter((t) => t.status === "open").length,
      win_count: wins,
      loss_count: losses,
      win_rate: trades.length ? (wins / trades.length) * 100 : 0,
      avg_pnl: avgPnl,
      total_pnl: totalPnl,
      best_trade_pnl: pnlValues.length ? Math.max(...pnlValues) : 0,
      worst_trade_pnl: pnlValues.length ? Math.min(...pnlValues) : 0,
      updated_at: now(),
    };
  });

  await writeDb(db);
}


export async function upsertUser(input: Pick<User, "id"> & Partial<User>) {
  const db = await readDb();
  const existing = db.users.find((u) => u.id === input.id);
  if (existing) {
    const updated = { ...existing, ...input } as User;
    db.users = db.users.map((u) => (u.id === existing.id ? updated : u));
    await writeDb(db);
    return updated;
  }

  const user: User = {
    id: input.id,
    email: input.email,
    name: input.name,
    image: input.image,
    github_handle: input.github_handle,
    created_at: now(),
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function getUserById(userId: string) {
  const db = await readDb();
  return db.users.find((u) => u.id === userId);
}

export async function getFollowerCount(authorId: string) {
  const db = await readDb();
  return db.followed_authors.filter((f) => f.author_id === authorId).length;
}

export async function getFollowedAuthorIds(userId: string) {
  const db = await readDb();
  return db.followed_authors.filter((f) => f.user_id === userId).map((f) => f.author_id);
}

export async function followAuthor(userId: string, authorId: string) {
  const db = await readDb();
  const existing = db.followed_authors.find((f) => f.user_id === userId && f.author_id === authorId);
  if (existing) return existing;
  const follow: FollowedAuthor = { id: id(), user_id: userId, author_id: authorId, created_at: now() };
  db.followed_authors.push(follow);
  await writeDb(db);
  return follow;
}

export async function unfollowAuthor(userId: string, authorId: string) {
  const db = await readDb();
  db.followed_authors = db.followed_authors.filter((f) => !(f.user_id === userId && f.author_id === authorId));
  await writeDb(db);
}

export async function getFollowedAuthors(userId: string) {
  const db = await readDb();
  return db.followed_authors.filter((f) => f.user_id === userId);
}

export async function getTradesForFollowedAuthors(userId: string) {
  const db = await readDb();
  const authorIds = new Set(db.followed_authors.filter((f) => f.user_id === userId).map((f) => f.author_id));
  return db.trades.filter((t) => authorIds.has(t.author_id));
}

export async function getWatchedTradeIds(userId: string) {
  const db = await readDb();
  return db.watchlist.filter((w) => w.user_id === userId).map((w) => w.trade_id);
}

export async function addToWatchlist(userId: string, tradeId: string) {
  const db = await readDb();
  const existing = db.watchlist.find((w) => w.user_id === userId && w.trade_id === tradeId);
  if (existing) return existing;
  const item: WatchlistItem = { id: id(), user_id: userId, trade_id: tradeId, created_at: now() };
  db.watchlist.push(item);
  await writeDb(db);
  return item;
}

export async function removeFromWatchlist(userId: string, tradeId: string) {
  const db = await readDb();
  db.watchlist = db.watchlist.filter((w) => !(w.user_id === userId && w.trade_id === tradeId));
  await writeDb(db);
}

export async function getWatchlist(userId: string) {
  const db = await readDb();
  return db.watchlist.filter((w) => w.user_id === userId);
}

export async function getWatchlistTrades(userId: string) {
  const db = await readDb();
  const tradeIds = new Set(db.watchlist.filter((w) => w.user_id === userId).map((w) => w.trade_id));
  return db.trades.filter((t) => tradeIds.has(t.id));
}
