import { NextResponse } from "next/server";
import { refreshPrices } from "@/lib/ingest";

export async function GET() {
  const result = await refreshPrices();
  return NextResponse.json({ ok: true, result });
}
