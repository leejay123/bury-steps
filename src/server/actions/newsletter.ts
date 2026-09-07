"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseContactEmail } from "@/lib/contact";
import { sendNewsletterSubscribedEmail } from "@/lib/email/mailer";
import { type ActionResult, logActionError } from "./shared";

async function requesterKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function subscribeToNewsletter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Same honeypot pattern as the contact form — a hidden field a real
  // visitor never sees or fills in.
  if (String(formData.get("company") ?? "").trim().length > 0) {
    return { ok: true, message: "Thanks — we'll be in touch." };
  }

  const key = await requesterKey();
  const limited = checkRateLimit(`${key}:subscribeToNewsletter`, 5, 10 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  const email = parseContactEmail(String(formData.get("email") ?? ""));
  if (email === "invalid") return { ok: false, error: "Enter a valid email address." };

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { unsubscribedAt: true },
    });
    // Already an active subscriber — say so instead of quietly re-sending
    // the same confirmation email every time they submit the form again.
    if (existing && !existing.unsubscribedAt) {
      return { ok: true, message: "You're already subscribed — thanks!" };
    }

    // Upsert rather than create: resubscribing after a previous unsubscribe
    // should just clear unsubscribedAt, not fail on the unique email index.
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { unsubscribedAt: null },
      select: { email: true, unsubscribeToken: true },
    });

    await sendNewsletterSubscribedEmail(subscriber).catch((err) => {
      console.error("subscribeToNewsletter: failed to send confirmation email", err);
    });
  } catch (err) {
    return logActionError("subscribeToNewsletter", err, "Could not subscribe. Try again.");
  }

  return { ok: true, message: "Thanks — we'll be in touch once there's news to share." };
}

/** Powers the one-click unsubscribe link in every newsletter email's footer. */
export async function unsubscribeFromNewsletter(token: string): Promise<boolean> {
  try {
    await prisma.newsletterSubscriber.update({
      where: { unsubscribeToken: token },
      data: { unsubscribedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}
