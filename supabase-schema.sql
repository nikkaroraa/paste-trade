-- Trade calls extracted from sources
CREATE TABLE trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES authors(id),
  source text NOT NULL,
  source_url text,
  source_post_id text UNIQUE,
  ticker text NOT NULL,
  asset_type text NOT NULL,
  direction text NOT NULL,
  thesis text,
  confidence text,
  timeframe text,
  entry_price decimal,
  current_price decimal,
  pnl_percent decimal,
  entry_odds decimal,
  current_odds decimal,
  resolved boolean DEFAULT false,
  resolution text,
  venue text,
  status text DEFAULT 'open',
  posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE authors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  handle text NOT NULL,
  platform text NOT NULL,
  avatar_url text,
  total_trades int DEFAULT 0,
  open_trades int DEFAULT 0,
  win_count int DEFAULT 0,
  loss_count int DEFAULT 0,
  win_rate decimal DEFAULT 0,
  avg_pnl decimal DEFAULT 0,
  total_pnl decimal DEFAULT 0,
  best_trade_pnl decimal DEFAULT 0,
  worst_trade_pnl decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(handle, platform)
);

CREATE TABLE price_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid REFERENCES trades(id) ON DELETE CASCADE,
  price decimal NOT NULL,
  pnl_percent decimal,
  snapshot_at timestamptz DEFAULT now()
);

CREATE TABLE markets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  market_id text NOT NULL,
  title text NOT NULL,
  category text,
  current_odds decimal,
  volume decimal,
  end_date timestamptz,
  resolved boolean DEFAULT false,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, market_id)
);
