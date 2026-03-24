import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addToWatchlist, getWatchlistTrades, removeFromWatchlist, upsertUser } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await upsertUser({
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    image: session.user.image ?? undefined,
    github_handle: session.user.githubHandle,
  });
  return session.user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trades = await getWatchlistTrades(user.id);
  return NextResponse.json({ trades });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tradeId } = await request.json();
  if (!tradeId) return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
  await addToWatchlist(user.id, tradeId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tradeId } = await request.json();
  if (!tradeId) return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
  await removeFromWatchlist(user.id, tradeId);
  return NextResponse.json({ ok: true });
}
