import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db";
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
    // Someone can be removed straight from Clerk's dashboard rather than
    // through the admin's own "remove member" flow, which reassigns walks
    // and accident reports first. Do the same reassignment here so this
    // doesn't fail on the foreign key when the departing member organised
    // walks or filed a report.
    try {
      const target = await prisma.user.findUnique({
        where: { clerkId: evt.data.id },
        select: { id: true },
      });
      if (target) {
        const fallbackAdmin = await prisma.user.findFirst({
          where: { role: "ADMIN", id: { not: target.id } },
          select: { id: true },
        });
        await prisma.$transaction(async (tx) => {
          if (fallbackAdmin) {
            await tx.walk.updateMany({
              where: { createdById: target.id },
              data: { createdById: fallbackAdmin.id },
            });
            await tx.accidentReport.updateMany({
              where: { createdById: target.id },
              data: { createdById: fallbackAdmin.id },
            });
          }
          await tx.user.delete({ where: { id: target.id } });
        });
      }
    } catch (err) {
      console.error("clerk webhook: failed to remove local user after Clerk deletion", err);
    }
  }

  return NextResponse.json({ received: true });
}
