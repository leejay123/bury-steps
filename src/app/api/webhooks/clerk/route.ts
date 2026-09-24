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
    // Clerk has already revoked auth — refusing the local delete would leave
    // an unusable zombie (isOwner / ADMIN with no sign-in). Always remove
    // the row. Last-owner / last-organiser guards stay on admin-initiated
    // deleteMember only. Reassign content under the same advisory locks as
    // deleteMember so concurrent demote/delete cannot race on ownership.
    try {
      const removedEmail = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(${COUNT_LIMIT_LOCK_KEYS.lastAdmin})`,
        );
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(${COUNT_LIMIT_LOCK_KEYS.lastOwner})`,
        );

        const target = await tx.user.findUnique({
          where: { clerkId: evt.data.id },
          select: {
            id: true,
            email: true,
            role: true,
            isOwner: true,
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

        const fallbackAdmin = await tx.user.findFirst({
          where: { role: "ADMIN", id: { not: target.id } },
          select: { id: true },
        });
        // Prefer another organiser for reassignment; otherwise any remaining
        // account (Restrict FKs on walks/reports/journey still need a target).
        const reassignTo =
          fallbackAdmin ??
          (await tx.user.findFirst({
            where: { id: { not: target.id } },
            select: { id: true },
          }));

        if (target.isOwner) {
          const ownerCount = await tx.user.count({ where: { isOwner: true } });
          if (ownerCount <= 1) {
            if (fallbackAdmin) {
              await tx.user.update({
                where: { id: fallbackAdmin.id },
                data: { isOwner: true },
              });
            } else {
              console.error(
                "CRITICAL: clerk webhook deleted last owner with no remaining organiser to inherit ownership — manual repair required",
              );
            }
          }
        }

        if (target.role === "ADMIN") {
          const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
          if (adminCount <= 1) {
            console.error(
              "CRITICAL: clerk webhook deleting last organiser — site has no usable admin until manual repair / INITIAL_ADMIN_EMAIL after wipe",
            );
          }
        }

        if (reassignTo) {
          if (target._count.walksCreated > 0) {
            await tx.walk.updateMany({
              where: { createdById: target.id },
              data: { createdById: reassignTo.id },
            });
          }
          if (target._count.accidentReports > 0) {
            await tx.accidentReport.updateMany({
              where: { createdById: target.id },
              data: { createdById: reassignTo.id },
            });
          }
          if (target._count.journeyEvents > 0) {
            await tx.walkJourneyEvent.updateMany({
              where: { createdById: target.id },
              data: { createdById: reassignTo.id },
            });
          }
        } else {
          // Sole remaining account — drop Restrict dependents so the row can go.
          if (target._count.journeyEvents > 0) {
            await tx.walkJourneyEvent.deleteMany({ where: { createdById: target.id } });
          }
          if (target._count.accidentReports > 0) {
            await tx.accidentReport.deleteMany({ where: { createdById: target.id } });
          }
          if (target._count.walksCreated > 0) {
            await tx.walk.deleteMany({ where: { createdById: target.id } });
          }
        }

        await tx.user.delete({ where: { id: target.id } });
        return target.email;
      });
      if (typeof removedEmail === "string" && removedEmail) {
        const { optOutNewsletterEverywhere } = await import("@/lib/email/newsletter-opt-out");
        await optOutNewsletterEverywhere(removedEmail).catch((err) => {
          console.error("clerk webhook: failed to opt deleted user out of newsletter", err);
        });
      }
    } catch (err) {
      console.error("clerk webhook: failed to remove local user after Clerk deletion", err);
    }
  }

  return NextResponse.json({ received: true });
}
