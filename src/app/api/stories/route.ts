import { NextResponse } from "next/server";
import { getOptionalUser, memberDisplayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { purgeExpiredStories } from "@/lib/stories";
import { signStoryPhotos, storiesConfigured } from "@/lib/story-storage";

export type StoryFeedItem = {
  id: string;
  src: string;
  createdAt: string;
  canDelete: boolean;
  canReport: boolean;
  /** Organisers only: how many people reported it. */
  reports: number;
};
export type StoryFeedPerson = {
  id: string;
  name: string;
  imageUrl: string | null;
  isMe: boolean;
  stories: StoryFeedItem[];
};
export type StoryFeed = {
  configured: boolean;
  me: { id: string; name: string; imageUrl: string | null; organiser: boolean } | null;
  people: StoryFeedPerson[];
};

/**
 * Live stories for the signed-in viewer (never for signed-out visitors), each
 * photo with a one-hour signed link. Always fresh: no saved copy.
 */
export async function GET() {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Sign in to see stories." }, { status: 401 });
  const empty: StoryFeed = { configured: storiesConfigured(), me: null, people: [] };
  const me = {
    id: user.id,
    name: memberDisplayName(user),
    imageUrl: user.imageUrl ?? null,
    organiser: user.role === "ADMIN",
  };
  if (!empty.configured) return NextResponse.json({ ...empty, me }, noStore);

  await purgeExpiredStories();
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      path: true,
      createdAt: true,
      userId: true,
      user: { select: { firstName: true, lastName: true, imageUrl: true } },
      _count: { select: { reports: true } },
    },
  });
  const links = await signStoryPhotos(stories.map((story) => story.path));

  const people = new Map<string, StoryFeedPerson>();
  for (const story of stories) {
    const src = links.get(story.path);
    if (!src) continue;
    const isMe = story.userId === user.id;
    const person =
      people.get(story.userId) ??
      ({
        id: story.userId,
        name: memberDisplayName(story.user),
        imageUrl: story.user.imageUrl ?? null,
        isMe,
        stories: [],
      } satisfies StoryFeedPerson);
    person.stories.push({
      id: story.id,
      src,
      createdAt: story.createdAt.toISOString(),
      canDelete: isMe || me.organiser,
      canReport: !isMe,
      reports: me.organiser ? story._count.reports : 0,
    });
    people.set(story.userId, person);
  }
  // Yours first, then whoever posted most recently.
  const list = [...people.values()].sort((a, b) => {
    if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
    const last = (p: StoryFeedPerson) => p.stories[p.stories.length - 1]?.createdAt ?? "";
    return last(b).localeCompare(last(a));
  });
  return NextResponse.json({ configured: true, me, people: list } satisfies StoryFeed, noStore);
}

const noStore = { headers: { "cache-control": "private, no-store" } };
