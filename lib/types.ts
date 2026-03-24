export type SourceType = "reddit" | "polymarket" | "news" | "manual";
export type AssetType = "crypto" | "stock" | "commodity" | "prediction";
export type DirectionType = "long" | "short" | "yes" | "no";
export type ConfidenceType = "high" | "medium" | "low";

export interface Trade {
  id: string;
  author_id: string;
  source: SourceType;
  source_url?: string;
  source_post_id?: string;
  ticker: string;
  asset_type: AssetType;
  direction: DirectionType;
  thesis?: string;
  confidence?: ConfidenceType;
  timeframe?: string;
  entry_price?: number;
  current_price?: number;
  pnl_percent?: number;
  entry_odds?: number;
  current_odds?: number;
  resolved: boolean;
  resolution?: string;
  venue?: string;
  status: "open" | "closed" | "expired";
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  handle: string;
  platform: string;
  avatar_url?: string;
  total_trades: number;
  open_trades: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  avg_pnl: number;
  total_pnl: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  github_handle?: string;
  created_at: string;
}

export interface FollowedAuthor {
  id: string;
  user_id: string;
  author_id: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  trade_id: string;
  created_at: string;
}

export interface PriceSnapshot {
  id: string;
  trade_id: string;
  price: number;
  pnl_percent?: number;
  snapshot_at: string;
}

export interface Market {
  id: string;
  platform: string;
  market_id: string;
  title: string;
  category?: string;
  current_odds?: number;
  volume?: number;
  end_date?: string;
  resolved: boolean;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTrade {
  has_trade: boolean;
  ticker: string;
  asset_type: AssetType;
  direction: DirectionType;
  thesis: string;
  confidence: ConfidenceType;
  timeframe: string;
  key_catalysts: string[];
  risks: string[];
}

export interface DbShape {
  trades: Trade[];
  authors: Author[];
  users: User[];
  watchlist: WatchlistItem[];
  followed_authors: FollowedAuthor[];
  price_snapshots: PriceSnapshot[];
  markets: Market[];
}
