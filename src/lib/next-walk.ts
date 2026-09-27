import { cache } from "react";
import { prisma } from "@/lib/db";

/** The soonest upcoming, not-cancelled walk, for the homepage announcement pill. */
export const getNextWalk = cache(async () => {
  try {
    return await prisma.walk.findFirst({
      where: { cancelledAt: null, startsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      select: { slug: true, startsAt: true, title: true, token: true },
    });
  } catch {
    return null;
  }
});
