import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LONDON } from "@/lib/dates";
import { loadWalkGame } from "@/lib/walk-progress";
import { buildProgressSummaryEmail } from "@/lib/email/mailer";
import { sendEmailBatch, type SendEmailInput } from "@/lib/email/client";

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

  // orderBy keeps the recipient list in a stable order across a retried
  // invocation, so sendEmailBatch's per-chunk idempotency key below (there's
  // no per-email idempotency on Resend's batch endpoint) lines up with the
  // same members' emails both times, rather than risking a reshuffled
  // chunk boundary re-sending someone or skipping them.
  const members = await prisma.user.findMany({
    where: { emailProgress: true },
    select: { id: true, email: true, firstName: true, unsubscribeToken: true },
    orderBy: { id: "asc" },
  });

  // Building each member's email means a DB read (loadWalkGame) per
  // person, so this stays a sequential loop rather than a Promise.all —
  // the actual send to Resend, batched below, is the part that needs
  // pacing, not this.
  const emails: SendEmailInput[] = [];
  for (const member of members) {
    try {
      const game = await loadWalkGame(member.id, referenceNow);
      // Skip anyone with nothing to report — no walks that month and no
      // streak — rather than send an empty, slightly deflating email.
      if (game.viewer.monthCount === 0 && game.viewer.streakWeeks === 0) continue;
      emails.push(
        await buildProgressSummaryEmail(
          {
            monthLabel,
            monthCount: game.viewer.monthCount,
            streakWeeks: game.viewer.streakWeeks,
            yearCount: game.viewer.yearCount,
            together: game.together,
          },
          member,
        ),
      );
    } catch (err) {
      console.error("monthly-progress: failed to build email for", member.id, err);
    }
  }

  const { sent } = await sendEmailBatch(emails, { idempotencyKeyPrefix: `progress-summary/${monthKey}` });

  return NextResponse.json({ monthKey, eligible: members.length, sent });
}
