import { NextRequest, NextResponse } from "next/server";
import { extractTrade } from "@/lib/ai/extract-trade";
import { upsertAuthor, upsertTrade, recomputeAuthorStats } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = String(body.text || "");
  const url = body.url ? String(body.url) : undefined;
  const confirm = Boolean(body.confirm);

  const data = await extractTrade(text);

  if (confirm && data.has_trade) {
    const author = await upsertAuthor({ handle: "manual", platform: "twitter" });
    await upsertTrade({
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
      posted_at: new Date().toISOString(),
    });
    await recomputeAuthorStats();
  }

  return NextResponse.json({ ok: true, data });
}
