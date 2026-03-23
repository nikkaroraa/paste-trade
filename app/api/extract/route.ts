import { NextRequest, NextResponse } from "next/server";
import { extractTrade } from "@/lib/ai/extract-trade";
import { getCoinGeckoPrices, tickerToCoinId } from "@/lib/prices/coingecko";
import { upsertAuthor, upsertTrade, recomputeAuthorStats, saveSnapshot } from "@/lib/db";

function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUrlText(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "paste-trade/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Could not fetch URL: ${res.status}`);
  }

  const html = await res.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const body = stripHtml(html).slice(0, 8000);

  return [title, description || ogDescription, body].filter(Boolean).join("\n\n");
}

async function resolveInputText(text: string, url?: string) {
  if (text.trim()) return text.trim();
  if (url && isUrl(url)) return fetchUrlText(url);
  return "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = String(body.text || "");
  const url = body.url ? String(body.url) : undefined;
  const confirm = Boolean(body.confirm);

  const sourceText = await resolveInputText(text, url);
  if (!sourceText) {
    return NextResponse.json({ ok: false, error: "Paste trade text or a valid URL." }, { status: 400 });
  }

  const data = await extractTrade(sourceText);

  if (confirm && data.has_trade) {
    const author = await upsertAuthor({ handle: "manual", platform: "manual" });
    const coinId = tickerToCoinId(data.ticker);
    const prices = coinId ? await getCoinGeckoPrices([data.ticker]) : {};
    const currentPrice = coinId ? prices[coinId]?.usd : undefined;

    const trade = await upsertTrade({
      author_id: author.id,
      source: "manual",
      source_url: url,
      source_post_id: `manual_${Date.now()}`,
      ticker: data.ticker,
      asset_type: data.asset_type,
      direction: data.direction,
      thesis: data.thesis,
      confidence: data.confidence,
      timeframe: data.timeframe,
      venue: data.asset_type === "prediction" ? "prediction" : "spot",
      entry_price: currentPrice,
      current_price: currentPrice,
      pnl_percent: currentPrice ? 0 : undefined,
      posted_at: new Date().toISOString(),
    });

    if (currentPrice) {
      await saveSnapshot({ trade_id: trade.id, price: currentPrice, pnl_percent: 0 });
    }

    await recomputeAuthorStats();
    return NextResponse.json({ ok: true, data, tradeId: trade.id });
  }

  return NextResponse.json({ ok: true, data, sourceText });
}
