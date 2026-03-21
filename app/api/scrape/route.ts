import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/ingest";

let lastScrapeAt = 0;
let running = false;
const COOLDOWN_MS = 60_000;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFullScrape();
  lastScrapeAt = Date.now();
  return NextResponse.json({ ok: true, result, lastScrapeAt });
}

export async function POST() {
  const now = Date.now();
  if (running) {
    return NextResponse.json({ ok: false, error: "Scrape already running" }, { status: 429 });
  }
  if (now - lastScrapeAt < COOLDOWN_MS) {
    return NextResponse.json(
      { ok: false, error: "Please wait before scraping again", retryAfter: Math.ceil((COOLDOWN_MS - (now - lastScrapeAt)) / 1000) },
      { status: 429 }
    );
  }

  running = true;
  try {
    const result = await runFullScrape();
    lastScrapeAt = Date.now();
    return NextResponse.json({ ok: true, result, lastScrapeAt });
  } catch {
    return NextResponse.json({ ok: false, error: "Scrape failed" }, { status: 500 });
  } finally {
    running = false;
  }
}
