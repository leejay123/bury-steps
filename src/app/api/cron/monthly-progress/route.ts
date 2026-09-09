import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LONDON } from "@/lib/dates";
import { loadWalkGame } from "@/lib/walk-progress";
import { sendProgressSummaryEmail } from "@/lib/email/mailer";

/**
 * Monthly recap — walks done, streak, group goal progress — for every
 * member opted into progress emails. Scheduled by vercel.json for the 1st
 * of each month; summarises the month that just finished, not the new one
 * that's just started.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  // The last instant of the previous month, in London's calendar — passing
  // this as `now` to loadWalkGame makes "this month" mean the month that
  // just ended, not the one this cron happens to be running in.
  const londonParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(londonParts.find((p) => p.type === "year")?.value);
  const month = Number(londonParts.find((p) => p.type === "month")?.value); // 1-12
  const referenceNow = new Date(Date.UTC(year, month - 1, 1));
  // JS Date.UTC rolls a negative month index back into the prior year on its
  // own (month - 2 is -1 in January), so deriving both the label and the
  // key from this one Date avoids hand-rolling that rollover ourselves.
  const prevMonth = new Date(Date.UTC(year, month - 2, 1));
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(
    prevMonth,
  );
  const monthKey = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, "0")}`;

  const members = await prisma.user.findMany({
    where: { emailProgress: true },
    select: { id: true, email: true, firstName: true, unsubscribeToken: true },
  });

  let sent = 0;
  for (const member of members) {
    try {
      const game = await loadWalkGame(member.id, referenceNow);
      // Skip anyone with nothing to report — no walks that month and no
      // streak — rather than send an empty, slightly deflating email.
      if (game.viewer.monthCount === 0 && game.viewer.streakWeeks === 0) continue;
      await sendProgressSummaryEmail(
        {
          monthLabel,
          monthKey,
          monthCount: game.viewer.monthCount,
          streakWeeks: game.viewer.streakWeeks,
          yearCount: game.viewer.yearCount,
          together: game.together,
        },
        member,
      );
      sent += 1;
    } catch (err) {
      console.error("monthly-progress: failed to notify", member.id, err);
    }
  }

  return NextResponse.json({ monthKey, eligible: members.length, sent });
}
