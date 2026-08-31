import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import { syncLocalUser } from "@/lib/local-user";

/**
 * Keeps the local User table in sync with Clerk. Optional — `requireUser()`
 * creates rows on demand — but this keeps names and emails current.
 * Optional. Point a Clerk webhook at <app-url>/api/webhooks/clerk for
 * user.created, user.updated, user.deleted. Without a signing secret this
 * route returns 400; the app still creates users on first sign-in.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = evt.data;
    const email =
      email_addresses.find((e: { id: string; email_address: string }) => e.id === primary_email_address_id)?.email_address ??
      email_addresses[0]?.email_address ??
      "";

    try {
      await syncLocalUser({
        clerkId: id,
        email,
        firstName: first_name,
        lastName: last_name,
      });
    } catch (err) {
      // requireUser() will create/refresh this same row on their next visit
      // anyway (see the doc comment above) — this webhook is an
      // optimisation, so log and move on rather than fail the whole request.
      console.error("clerk webhook: failed to sync local user", err);
    }
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    // Same reassignment + last-organiser guard as admin "remove member", under
    // the same advisory lock so concurrent demote/delete cannot wipe the last
    // organiser. Journey events Restrict on creator — must reassign too.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(${COUNT_LIMIT_LOCK_KEYS.lastAdmin})`,
        );

        const target = await tx.user.findUnique({
          where: { clerkId: evt.data.id },
          select: {
            id: true,
            role: true,
            _count: {
              select: {
                walksCreated: true,
                accidentReports: true,
                journeyEvents: true,
              },
            },
          },
        });
        if (!target) return;

        if (target.role === "ADMIN") {
          const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
          if (adminCount <= 1) {
            console.error(
              "clerk webhook: refused to delete last organiser after Clerk user.deleted",
            );
            return;
          }
        }

        const fallbackAdmin = await tx.user.findFirst({
          where: { role: "ADMIN", id: { not: target.id } },
          select: { id: true },
        });

        if (
          !fallbackAdmin &&
          (target._count.walksCreated > 0 ||
            target._count.accidentReports > 0 ||
            target._count.journeyEvents > 0)
        ) {
          console.error(
            "clerk webhook: no fallback organiser to reassign walks/reports/journey",
          );
          return;
        }

        if (fallbackAdmin) {
          if (target._count.walksCreated > 0) {
            await tx.walk.updateMany({
              where: { createdById: target.id },
              data: { createdById: fallbackAdmin.id },
            });
          }
          if (target._count.accidentReports > 0) {
            await tx.accidentReport.updateMany({
              where: { createdById: target.id },
              data: { createdById: fallbackAdmin.id },
            });
          }
          if (target._count.journeyEvents > 0) {
            await tx.walkJourneyEvent.updateMany({
              where: { createdById: target.id },
              data: { createdById: fallbackAdmin.id },
            });
          }
        }

        await tx.user.delete({ where: { id: target.id } });
      });
    } catch (err) {
      console.error("clerk webhook: failed to remove local user after Clerk deletion", err);
    }
  }

  return NextResponse.json({ received: true });
}
