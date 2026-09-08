import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

/**
 * Records every Resend delivery event (sent/delivered/bounced/complained/
 * opened/clicked/...) so a bounce or spam complaint is visible after the
 * fact instead of failing silently — see EmailEvent in schema.prisma.
 *
 * Point a Resend webhook at <app-url>/api/webhooks/resend (all "Email"
 * events) and set its Signing Secret as RESEND_WEBHOOK_SECRET. Without that
 * secret this route returns 500 — sending itself is unaffected either way,
 * this is purely for after-the-fact visibility.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("resend webhook: RESEND_WEBHOOK_SECRET is not set");
    return new NextResponse("Not configured", { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: { email_id?: string; to?: string[] } };
  try {
    event = new Webhook(secret).verify(payload, headers) as unknown as typeof event;
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const resendId = event.data.email_id ?? "";
  const recipient = event.data.to?.[0] ?? "";

  try {
    await prisma.emailEvent.create({
      data: { resendId, type: event.type, recipient, data: event.data },
    });
  } catch (err) {
    // Logged, not fatal — Resend retries on non-2xx, and losing one event
    // (e.g. a transient DB hiccup) isn't worth a retry storm.
    console.error("resend webhook: failed to store event", err);
  }

  if (event.type === "email.bounced" || event.type === "email.complained") {
    console.error(`resend webhook: ${event.type} for ${recipient}`, event.data);
  }

  return NextResponse.json({ received: true });
}
