import { NextResponse } from "next/server";
import { getAuthors, getTrades } from "@/lib/db";

export async function GET() {
  const [trades, authors] = await Promise.all([getTrades(), getAuthors()]);
  return NextResponse.json({ ok: true, trades, authors, latest: trades[0]?.created_at ?? null });
}
