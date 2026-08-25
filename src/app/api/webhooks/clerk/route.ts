import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db";

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

    await prisma.user.upsert({
      where: { clerkId: id },
      create: { clerkId: id, email, firstName: first_name, lastName: last_name },
      update: { email, firstName: first_name, lastName: last_name },
    });
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
  }

  return NextResponse.json({ received: true });
}
