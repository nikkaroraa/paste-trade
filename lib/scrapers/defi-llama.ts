export interface DefiSignal {
  protocol: string;
  symbol: string;
  tvl: number;
  change_1d: number;
  reason: string;
}

export async function scrapeDefiLlamaSignals(): Promise<DefiSignal[]> {
  try {
    const res = await fetch("https://api.llama.fi/protocols", { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const protocols = (await res.json()) as Array<{
      name: string;
      symbol: string;
      tvl: number;
      change_1d?: number;
    }>;

    return protocols
      .filter((p) => Math.abs(p.change_1d ?? 0) >= 8)
      .slice(0, 50)
      .map((p) => ({
        protocol: p.name,
        symbol: p.symbol || p.name,
        tvl: p.tvl,
        change_1d: p.change_1d ?? 0,
        reason: `TVL moved ${Number(p.change_1d ?? 0).toFixed(2)}% in 24h`,
      }));
  } catch {
    return [];
  }
}
