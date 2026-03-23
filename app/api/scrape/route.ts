import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/ingest";

let lastScrapeAt = 0;
let running = false;
const COOLDOWN_MS = 60_000;

function isAuthorized(secret: string | null) {
  const expected = process.env.CRON_SECRET || "dev";
  return secret === expected;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!isAuthorized(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (running) {
    return NextResponse.json({ ok: false, error: "Scrape already running" }, { status: 429 });
  }

  running = true;
  try {
    const result = await runFullScrape();
    lastScrapeAt = Date.now();
    return NextResponse.json({ ok: true, result, lastScrapeAt });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scrape failed" }, { status: 500 });
  } finally {
    running = false;
  }
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
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scrape failed" }, { status: 500 });
  } finally {
    running = false;
  }
}
