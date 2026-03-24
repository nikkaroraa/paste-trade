import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFollowedAuthorIds, getFollowedAuthors, getTradesForFollowedAuthors, upsertUser } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await upsertUser({
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    image: session.user.image ?? undefined,
    github_handle: session.user.githubHandle,
  });

  const [follows, authorIds, trades] = await Promise.all([
    getFollowedAuthors(session.user.id),
    getFollowedAuthorIds(session.user.id),
    getTradesForFollowedAuthors(session.user.id),
  ]);

  return NextResponse.json({ follows, authorIds, trades });
}
