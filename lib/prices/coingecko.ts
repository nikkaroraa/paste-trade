const cache = new Map<string, { value: Record<string, { usd: number }>; expiry: number }>();

const coinMap: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  ARB: "arbitrum",
};

export async function getCoinGeckoPrices(tickers: string[]) {
  const ids = Array.from(
    new Set(
      tickers
        .map((t) => coinMap[t.toUpperCase()])
        .filter(Boolean),
    ),
  );
  if (!ids.length) return {};

  const key = ids.join(",");
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiry > now) return existing.value;

  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`);
  if (!res.ok) return {};
  const data = (await res.json()) as Record<string, { usd: number }>;
  cache.set(key, { value: data, expiry: now + 60_000 });
  return data;
}

export function tickerToCoinId(ticker: string) {
  return coinMap[ticker.toUpperCase()];
}
