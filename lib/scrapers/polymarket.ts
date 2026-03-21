export interface PolymarketMarket {
  id: string;
  title: string;
  category?: string;
  volume?: number;
  endDate?: string;
  active?: boolean;
  outcomes?: { price?: number; name?: string }[];
}

export async function scrapePolymarket(): Promise<PolymarketMarket[]> {
  try {
    const res = await fetch("https://gamma-api.polymarket.com/markets", { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const markets = (await res.json()) as PolymarketMarket[];

    return markets
      .filter((m) => m.active)
      .filter((m) => {
        const c = (m.category || "").toLowerCase();
        return c.includes("crypto") || c.includes("politic") || c.includes("econom");
      })
      .slice(0, 120);
  } catch {
    return [];
  }
}
