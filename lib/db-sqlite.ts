import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { Author, FollowedAuthor, Market, PriceSnapshot, Trade, User, WatchlistItem } from "./types";

const dbFile = path.join(process.cwd(), "data", "paste-trade.db");
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS authors (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    platform TEXT NOT NULL,
    avatar_url TEXT,
    total_trades INTEGER DEFAULT 0,
    open_trades INTEGER DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate REAL DEFAULT 0,
    avg_pnl REAL DEFAULT 0,
    total_pnl REAL DEFAULT 0,
    best_trade_pnl REAL DEFAULT 0,
    worst_trade_pnl REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(handle, platform)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    author_id TEXT REFERENCES authors(id),
    source TEXT NOT NULL,
    source_url TEXT,
    source_post_id TEXT UNIQUE,
    ticker TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    thesis TEXT,
    confidence TEXT,
    timeframe TEXT,
    entry_price REAL,
    current_price REAL,
    pnl_percent REAL,
    entry_odds REAL,
    current_odds REAL,
    resolved INTEGER DEFAULT 0,
    resolution TEXT,
    venue TEXT,
    status TEXT DEFAULT 'open',
    posted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    image TEXT,
    github_handle TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    trade_id TEXT REFERENCES trades(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, trade_id)
  );

  CREATE TABLE IF NOT EXISTS followed_authors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    author_id TEXT REFERENCES authors(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, author_id)
  );

  CREATE TABLE IF NOT EXISTS price_snapshots (
    id TEXT PRIMARY KEY,
    trade_id TEXT REFERENCES trades(id),
    price REAL NOT NULL,
    pnl_percent REAL,
    snapshot_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    market_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    current_odds REAL,
    volume REAL,
    end_date TEXT,
    resolved INTEGER DEFAULT 0,
    resolution TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(platform, market_id)
  );
`);

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function mapTrade(row: Record<string, unknown>): Trade {
  return {
    ...(row as unknown as Trade),
    resolved: Boolean(row.resolved),
    source_url: row.source_url ? String(row.source_url) : undefined,
    source_post_id: row.source_post_id ? String(row.source_post_id) : undefined,
    thesis: row.thesis ? String(row.thesis) : undefined,
    confidence: row.confidence ? (String(row.confidence) as Trade["confidence"]) : undefined,
    timeframe: row.timeframe ? String(row.timeframe) : undefined,
    entry_price: typeof row.entry_price === "number" ? row.entry_price : row.entry_price == null ? undefined : Number(row.entry_price),
    current_price: typeof row.current_price === "number" ? row.current_price : row.current_price == null ? undefined : Number(row.current_price),
    pnl_percent: typeof row.pnl_percent === "number" ? row.pnl_percent : row.pnl_percent == null ? undefined : Number(row.pnl_percent),
    entry_odds: typeof row.entry_odds === "number" ? row.entry_odds : row.entry_odds == null ? undefined : Number(row.entry_odds),
    current_odds: typeof row.current_odds === "number" ? row.current_odds : row.current_odds == null ? undefined : Number(row.current_odds),
    resolution: row.resolution ? String(row.resolution) : undefined,
    venue: row.venue ? String(row.venue) : undefined,
    posted_at: row.posted_at ? String(row.posted_at) : undefined,
  };
}

function mapAuthor(row: Record<string, unknown>): Author {
  return {
    ...(row as unknown as Author),
    avatar_url: row.avatar_url ? String(row.avatar_url) : undefined,
    total_trades: Number(row.total_trades ?? 0),
    open_trades: Number(row.open_trades ?? 0),
    win_count: Number(row.win_count ?? 0),
    loss_count: Number(row.loss_count ?? 0),
    win_rate: Number(row.win_rate ?? 0),
    avg_pnl: Number(row.avg_pnl ?? 0),
    total_pnl: Number(row.total_pnl ?? 0),
    best_trade_pnl: Number(row.best_trade_pnl ?? 0),
    worst_trade_pnl: Number(row.worst_trade_pnl ?? 0),
  };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    image: row.image ? String(row.image) : undefined,
    github_handle: row.github_handle ? String(row.github_handle) : undefined,
    created_at: String(row.created_at),
  };
}

function mapWatchlistItem(row: Record<string, unknown>): WatchlistItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    trade_id: String(row.trade_id),
    created_at: String(row.created_at),
  };
}

function mapFollowedAuthor(row: Record<string, unknown>): FollowedAuthor {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    author_id: String(row.author_id),
    created_at: String(row.created_at),
  };
}

function mapSnapshot(row: Record<string, unknown>): PriceSnapshot {
  return {
    ...(row as unknown as PriceSnapshot),
    price: Number(row.price),
    pnl_percent: row.pnl_percent == null ? undefined : Number(row.pnl_percent),
  };
}

function mapMarket(row: Record<string, unknown>): Market {
  return {
    ...(row as unknown as Market),
    category: row.category ? String(row.category) : undefined,
    current_odds: row.current_odds == null ? undefined : Number(row.current_odds),
    volume: row.volume == null ? undefined : Number(row.volume),
    end_date: row.end_date ? String(row.end_date) : undefined,
    resolved: Boolean(row.resolved),
    resolution: row.resolution ? String(row.resolution) : undefined,
  };
}

export async function getTrades() {
  const rows = db.prepare("SELECT * FROM trades ORDER BY COALESCE(posted_at, created_at) DESC, created_at DESC").all() as Record<string, unknown>[];
  return rows.map(mapTrade);
}

export async function getTradeById(tradeId: string) {
  const row = db.prepare("SELECT * FROM trades WHERE id = ?").get(tradeId) as Record<string, unknown> | undefined;
  return row ? mapTrade(row) : undefined;
}

export async function upsertTrade(input: Partial<Trade> & Pick<Trade, "ticker" | "asset_type" | "direction" | "source">) {
  const existing = (input.source_post_id
    ? db.prepare("SELECT * FROM trades WHERE source_post_id = ?").get(input.source_post_id)
    : input.source_url
      ? db.prepare("SELECT * FROM trades WHERE source_url = ? AND ticker = ? LIMIT 1").get(input.source_url, input.ticker)
      : input.author_id
        ? db.prepare("SELECT * FROM trades WHERE author_id = ? AND ticker = ? AND direction = ? AND substr(created_at, 1, 10) = ? LIMIT 1").get(input.author_id, input.ticker, input.direction, new Date().toISOString().slice(0, 10))
        : undefined) as Record<string, unknown> | undefined;

  if (existing) {
    const merged = { ...mapTrade(existing), ...input, id: String(existing.id), updated_at: now() } as Trade;
    db.prepare(`
      UPDATE trades SET
        author_id = @author_id,
        source = @source,
        source_url = @source_url,
        source_post_id = @source_post_id,
        ticker = @ticker,
        asset_type = @asset_type,
        direction = @direction,
        thesis = @thesis,
        confidence = @confidence,
        timeframe = @timeframe,
        entry_price = @entry_price,
        current_price = @current_price,
        pnl_percent = @pnl_percent,
        entry_odds = @entry_odds,
        current_odds = @current_odds,
        resolved = @resolved,
        resolution = @resolution,
        venue = @venue,
        status = @status,
        posted_at = @posted_at,
        updated_at = @updated_at
      WHERE id = @id
    `).run({ ...merged, resolved: merged.resolved ? 1 : 0 });
    return merged;
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

  db.prepare(`
    INSERT INTO trades (
      id, author_id, source, source_url, source_post_id, ticker, asset_type, direction, thesis,
      confidence, timeframe, entry_price, current_price, pnl_percent, entry_odds, current_odds,
      resolved, resolution, venue, status, posted_at, created_at, updated_at
    ) VALUES (
      @id, @author_id, @source, @source_url, @source_post_id, @ticker, @asset_type, @direction, @thesis,
      @confidence, @timeframe, @entry_price, @current_price, @pnl_percent, @entry_odds, @current_odds,
      @resolved, @resolution, @venue, @status, @posted_at, @created_at, @updated_at
    )
  `).run({ ...trade, resolved: trade.resolved ? 1 : 0 });
  return trade;
}

export async function upsertAuthor(input: Pick<Author, "handle" | "platform"> & Partial<Author>) {
  const existing = db.prepare("SELECT * FROM authors WHERE handle = ? AND platform = ?").get(input.handle, input.platform) as Record<string, unknown> | undefined;

  if (existing) {
    const merged = { ...mapAuthor(existing), ...input, id: String(existing.id), updated_at: now() } as Author;
    db.prepare(`
      UPDATE authors SET
        handle = @handle,
        platform = @platform,
        avatar_url = @avatar_url,
        total_trades = @total_trades,
        open_trades = @open_trades,
        win_count = @win_count,
        loss_count = @loss_count,
        win_rate = @win_rate,
        avg_pnl = @avg_pnl,
        total_pnl = @total_pnl,
        best_trade_pnl = @best_trade_pnl,
        worst_trade_pnl = @worst_trade_pnl,
        updated_at = @updated_at
      WHERE id = @id
    `).run(merged);
    return merged;
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

  db.prepare(`
    INSERT INTO authors (
      id, handle, platform, avatar_url, total_trades, open_trades, win_count, loss_count,
      win_rate, avg_pnl, total_pnl, best_trade_pnl, worst_trade_pnl, created_at, updated_at
    ) VALUES (
      @id, @handle, @platform, @avatar_url, @total_trades, @open_trades, @win_count, @loss_count,
      @win_rate, @avg_pnl, @total_pnl, @best_trade_pnl, @worst_trade_pnl, @created_at, @updated_at
    )
  `).run(author);
  return author;
}

export async function upsertUser(input: Pick<User, "id"> & Partial<User>) {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(input.id) as Record<string, unknown> | undefined;

  if (existing) {
    const merged = {
      ...mapUser(existing),
      ...input,
      id: String(existing.id),
      created_at: String(existing.created_at),
    } as User;

    db.prepare(`
      UPDATE users SET
        email = @email,
        name = @name,
        image = @image,
        github_handle = @github_handle
      WHERE id = @id
    `).run(merged);

    return merged;
  }

  const user: User = {
    id: input.id,
    email: input.email,
    name: input.name,
    image: input.image,
    github_handle: input.github_handle,
    created_at: now(),
  };

  db.prepare("INSERT INTO users (id, email, name, image, github_handle, created_at) VALUES (@id, @email, @name, @image, @github_handle, @created_at)").run(user);
  return user;
}

export async function getUserById(userId: string) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  return row ? mapUser(row) : undefined;
}

export async function getAuthors() {
  const rows = db.prepare("SELECT * FROM authors ORDER BY total_pnl DESC, win_rate DESC, total_trades DESC").all() as Record<string, unknown>[];
  return rows.map(mapAuthor);
}

export async function getAuthorById(authorId: string) {
  const row = db.prepare("SELECT * FROM authors WHERE id = ?").get(authorId) as Record<string, unknown> | undefined;
  return row ? mapAuthor(row) : undefined;
}

export async function getFollowerCount(authorId: string) {
  const row = db.prepare("SELECT COUNT(*) as count FROM followed_authors WHERE author_id = ?").get(authorId) as { count: number };
  return Number(row?.count ?? 0);
}

export async function getFollowedAuthorIds(userId: string) {
  const rows = db.prepare("SELECT author_id FROM followed_authors WHERE user_id = ?").all(userId) as Array<{ author_id: string }>;
  return rows.map((row) => row.author_id);
}

export async function followAuthor(userId: string, authorId: string) {
  const follow: FollowedAuthor = { id: id(), user_id: userId, author_id: authorId, created_at: now() };
  db.prepare("INSERT OR IGNORE INTO followed_authors (id, user_id, author_id, created_at) VALUES (@id, @user_id, @author_id, @created_at)").run(follow);
  return follow;
}

export async function unfollowAuthor(userId: string, authorId: string) {
  db.prepare("DELETE FROM followed_authors WHERE user_id = ? AND author_id = ?").run(userId, authorId);
}

export async function getFollowedAuthors(userId: string) {
  const rows = db.prepare(`
    SELECT fa.*
    FROM followed_authors fa
    WHERE fa.user_id = ?
    ORDER BY fa.created_at DESC
  `).all(userId) as Record<string, unknown>[];
  return rows.map(mapFollowedAuthor);
}

export async function getTradesForFollowedAuthors(userId: string) {
  const rows = db.prepare(`
    SELECT t.*
    FROM trades t
    INNER JOIN followed_authors fa ON fa.author_id = t.author_id
    WHERE fa.user_id = ?
    ORDER BY COALESCE(t.posted_at, t.created_at) DESC, t.created_at DESC
  `).all(userId) as Record<string, unknown>[];
  return rows.map(mapTrade);
}

export async function getWatchedTradeIds(userId: string) {
  const rows = db.prepare("SELECT trade_id FROM watchlist WHERE user_id = ?").all(userId) as Array<{ trade_id: string }>;
  return rows.map((row) => row.trade_id);
}

export async function addToWatchlist(userId: string, tradeId: string) {
  const item: WatchlistItem = { id: id(), user_id: userId, trade_id: tradeId, created_at: now() };
  db.prepare("INSERT OR IGNORE INTO watchlist (id, user_id, trade_id, created_at) VALUES (@id, @user_id, @trade_id, @created_at)").run(item);
  return item;
}

export async function removeFromWatchlist(userId: string, tradeId: string) {
  db.prepare("DELETE FROM watchlist WHERE user_id = ? AND trade_id = ?").run(userId, tradeId);
}

export async function getWatchlist(userId: string) {
  const rows = db.prepare(`
    SELECT w.*
    FROM watchlist w
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(userId) as Record<string, unknown>[];
  return rows.map(mapWatchlistItem);
}

export async function getWatchlistTrades(userId: string) {
  const rows = db.prepare(`
    SELECT t.*
    FROM trades t
    INNER JOIN watchlist w ON w.trade_id = t.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(userId) as Record<string, unknown>[];
  return rows.map(mapTrade);
}

export async function saveSnapshot(input: Omit<PriceSnapshot, "id" | "snapshot_at"> & Partial<Pick<PriceSnapshot, "snapshot_at">>) {
  const snapshot: PriceSnapshot = {
    id: id(),
    trade_id: input.trade_id,
    price: input.price,
    pnl_percent: input.pnl_percent,
    snapshot_at: input.snapshot_at ?? now(),
  };

  db.prepare("INSERT INTO price_snapshots (id, trade_id, price, pnl_percent, snapshot_at) VALUES (@id, @trade_id, @price, @pnl_percent, @snapshot_at)").run(snapshot);
  return snapshot;
}

export async function getSnapshotsByTradeId(tradeId: string) {
  const rows = db.prepare("SELECT * FROM price_snapshots WHERE trade_id = ? ORDER BY snapshot_at ASC").all(tradeId) as Record<string, unknown>[];
  return rows.map(mapSnapshot);
}

export async function upsertMarket(input: Omit<Market, "id" | "created_at" | "updated_at"> & Partial<Pick<Market, "id">>) {
  const existing = db.prepare("SELECT * FROM markets WHERE platform = ? AND market_id = ?").get(input.platform, input.market_id) as Record<string, unknown> | undefined;
  if (existing) {
    const merged = { ...mapMarket(existing), ...input, id: String(existing.id), updated_at: now() } as Market;
    db.prepare(`
      UPDATE markets SET
        platform = @platform,
        market_id = @market_id,
        title = @title,
        category = @category,
        current_odds = @current_odds,
        volume = @volume,
        end_date = @end_date,
        resolved = @resolved,
        resolution = @resolution,
        updated_at = @updated_at
      WHERE id = @id
    `).run({ ...merged, resolved: merged.resolved ? 1 : 0 });
    return merged;
  }

  const market: Market = {
    id: id(),
    created_at: now(),
    updated_at: now(),
    ...input,
  };

  db.prepare(`
    INSERT INTO markets (
      id, platform, market_id, title, category, current_odds, volume, end_date, resolved, resolution, created_at, updated_at
    ) VALUES (
      @id, @platform, @market_id, @title, @category, @current_odds, @volume, @end_date, @resolved, @resolution, @created_at, @updated_at
    )
  `).run({ ...market, resolved: market.resolved ? 1 : 0 });
  return market;
}

export async function getMarkets() {
  const rows = db.prepare("SELECT * FROM markets ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(mapMarket);
}

export async function recomputeAuthorStats() {
  const authors = await getAuthors();

  const updateStats = db.prepare(`
    UPDATE authors SET
      total_trades = @total_trades,
      open_trades = @open_trades,
      win_count = @win_count,
      loss_count = @loss_count,
      win_rate = @win_rate,
      avg_pnl = @avg_pnl,
      total_pnl = @total_pnl,
      best_trade_pnl = @best_trade_pnl,
      worst_trade_pnl = @worst_trade_pnl,
      updated_at = @updated_at
    WHERE id = @id
  `);

  const tradeRows = db.prepare("SELECT author_id, status, pnl_percent FROM trades").all() as Array<Record<string, unknown>>;
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const trade of tradeRows) {
    const authorId = String(trade.author_id ?? "");
    const list = grouped.get(authorId) ?? [];
    list.push(trade);
    grouped.set(authorId, list);
  }

  const tx = db.transaction(() => {
    for (const author of authors) {
      const trades = grouped.get(author.id) ?? [];
      const pnlValues = trades.map((trade) => Number(trade.pnl_percent ?? 0));
      const wins = pnlValues.filter((value) => value > 0).length;
      const losses = pnlValues.filter((value) => value < 0).length;
      const totalPnl = pnlValues.reduce((sum, value) => sum + value, 0);
      const avgPnl = trades.length ? totalPnl / trades.length : 0;

      updateStats.run({
        id: author.id,
        total_trades: trades.length,
        open_trades: trades.filter((trade) => String(trade.status ?? "open") === "open").length,
        win_count: wins,
        loss_count: losses,
        win_rate: trades.length ? (wins / trades.length) * 100 : 0,
        avg_pnl: avgPnl,
        total_pnl: totalPnl,
        best_trade_pnl: pnlValues.length ? Math.max(...pnlValues) : 0,
        worst_trade_pnl: pnlValues.length ? Math.min(...pnlValues) : 0,
        updated_at: now(),
      });
    }
  });

  tx();
}
