import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { followAuthor, getFollowedAuthors, getFollowedAuthorIds, unfollowAuthor, upsertUser } from "@/lib/db";

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
  const follows = await getFollowedAuthors(user.id);
  const authorIds = await getFollowedAuthorIds(user.id);
  return NextResponse.json({ follows, authorIds });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { authorId } = await request.json();
  if (!authorId) return NextResponse.json({ error: "authorId is required" }, { status: 400 });
  await followAuthor(user.id, authorId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { authorId } = await request.json();
  if (!authorId) return NextResponse.json({ error: "authorId is required" }, { status: 400 });
  await unfollowAuthor(user.id, authorId);
  return NextResponse.json({ ok: true });
}
