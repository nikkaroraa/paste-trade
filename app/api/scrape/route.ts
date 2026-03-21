import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/ingest";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFullScrape();
  return NextResponse.json({ ok: true, result });
}
