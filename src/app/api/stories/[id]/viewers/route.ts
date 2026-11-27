import { NextResponse } from "next/server";
import { getOptionalUser, memberDisplayName } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type StoryViewerEntry = {
  id: string;
  name: string;
  imageUrl: string | null;
  viewedAt: string;
};
export type StoryViewers = { viewers: StoryViewerEntry[] };

const noStore = { headers: { "cache-control": "private, no-store" } };

/**
 * Who has viewed a story, newest first. Only for the person who posted it:
 * everyone else, organisers included, gets "not found".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Sign in to see stories." }, { status: 401 });
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { userId: true, expiresAt: true },
  });
  if (!story || story.userId !== user.id || story.expiresAt <= new Date())
    return NextResponse.json({ error: "That story has gone." }, { status: 404, ...noStore });

  const views = await prisma.storyView.findMany({
    where: { storyId: id },
    orderBy: { viewedAt: "desc" },
    select: {
      userId: true,
      viewedAt: true,
      user: { select: { firstName: true, lastName: true, imageUrl: true } },
    },
  });
  return NextResponse.json(
    {
      viewers: views.map((view) => ({
        id: view.userId,
        name: memberDisplayName(view.user),
        imageUrl: view.user.imageUrl ?? null,
        viewedAt: view.viewedAt.toISOString(),
      })),
    } satisfies StoryViewers,
    noStore,
  );
}
