const cache = new Map<string, { value: Record<string, { usd: number }>; expiry: number }>();
let lastRequestAt = 0;

const TICKER_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  DOT: "polkadot",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  DOGE: "dogecoin",
  ADA: "cardano",
  XRP: "ripple",
  ATOM: "cosmos",
  NEAR: "near",
  APT: "aptos",
  SUI: "sui",
  FET: "fetch-ai",
  PEPE: "pepe",
  BONK: "bonk",
  TRUMP: "official-trump",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function respectRateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  const minGap = 1_250;
  if (elapsed < minGap) {
    await sleep(minGap - elapsed);
  }
  lastRequestAt = Date.now();
}

export async function getCoinGeckoPrices(tickers: string[]) {
  const ids = Array.from(new Set(tickers.map((ticker) => tickerToCoinId(ticker)).filter(Boolean))) as string[];
  if (!ids.length) return {};

  const key = ids.slice().sort().join(",");
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiry > now) {
    return cached.value;
  }

  await respectRateLimit();

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("vs_currencies", "usd");

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 429) {
    const retryAfterSeconds = Number(res.headers.get("retry-after") ?? "60");
    await sleep(Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 60_000);
    return getCoinGeckoPrices(tickers);
  }

  if (!res.ok) {
    return {};
  }

  const data = (await res.json()) as Record<string, { usd: number }>;
  cache.set(key, { value: data, expiry: now + 60_000 });
  return data;
}

export function tickerToCoinId(ticker: string) {
  return TICKER_MAP[ticker.trim().toUpperCase()];
}

export { TICKER_MAP };
