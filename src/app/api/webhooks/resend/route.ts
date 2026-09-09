import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

/**
 * Records every Resend delivery event (sent/delivered/bounced/complained/
 * opened/clicked/...) so a bounce or spam complaint is visible after the
 * fact instead of failing silently — see EmailEvent in schema.prisma. Also
 * mirrors a "contact.updated" unsubscribe (fired when someone clicks the
 * Resend-hosted one-click unsubscribe link on a newsletter broadcast) back
 * into our own tables — see the block near the bottom of this function.
 *
 * Point a Resend webhook at <app-url>/api/webhooks/resend and subscribe it
 * to both the "Email" events AND the "Contact" events (specifically
 * contact.updated — without it, someone who unsubscribes via that link
 * still shows as subscribed in our own subscriber list and on their own
 * preferences page, even though Resend itself correctly stops sending to
 * them either way). Set the webhook's Signing Secret as
 * RESEND_WEBHOOK_SECRET. Without that secret this route returns 500 —
 * sending itself is unaffected either way, this is purely for after-the-
 * fact visibility and keeping our own records in sync.
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

  // svix's Webhook.verify() only checks the signature (throwing if it's
  // invalid) — it does NOT return the parsed payload, despite its type
  // signature suggesting otherwise. Every call here was silently getting
  // back `undefined` and crashing on the next line, failing every single
  // webhook delivery since this route was added. Parse the payload
  // ourselves once the signature's confirmed valid.
  let event: {
    type: string;
    data: { email_id?: string; to?: string[]; email?: string; unsubscribed?: boolean };
  };
  try {
    new Webhook(secret).verify(payload, headers);
    event = JSON.parse(payload);
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

  // A newsletter broadcast's one-click unsubscribe link is Resend-hosted
  // (the {{{RESEND_UNSUBSCRIBE_URL}}} merge tag) rather than our own
  // /email-preferences page, so clicking it only updates the contact over
  // in Resend's audience — Resend itself correctly skips them on every
  // future broadcast either way, but without this, our own subscriber
  // list and a member's own "Newsletter" checkbox would keep showing them
  // as subscribed. Mirror that unsubscribe back into our own tables so
  // both stay accurate.
  if (event.type === "contact.updated" && event.data.unsubscribed === true && event.data.email) {
    const email = event.data.email;
    try {
      await Promise.all([
        prisma.newsletterSubscriber.updateMany({
          where: { email, unsubscribedAt: null },
          data: { unsubscribedAt: new Date() },
        }),
        prisma.user.updateMany({
          where: { email, emailNewsletter: true },
          data: { emailNewsletter: false },
        }),
      ]);
    } catch (err) {
      console.error("resend webhook: failed to mirror contact unsubscribe", err);
    }
  }

  return NextResponse.json({ received: true });
}
