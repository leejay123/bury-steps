"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseContactEmail } from "@/lib/contact";
import { getEmailBrand } from "@/lib/email/brand";
import { getResendClient, fromAddress } from "@/lib/email/client";
import { sendNewsletterSubscribedEmail } from "@/lib/email/mailer";
import { paragraphsFrom } from "@/lib/email/render-template";
import { getOrCreateAudienceId, syncContactSubscribed, syncContactUnsubscribed } from "@/lib/email/resend-audience";
import { NewsletterCampaignEmail } from "@/lib/email/templates/newsletter-campaign";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

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

    await Promise.all([
      sendNewsletterSubscribedEmail(subscriber).catch((err) => {
        console.error("subscribeToNewsletter: failed to send confirmation email", err);
      }),
      syncContactSubscribed(subscriber.email),
    ]);
  } catch (err) {
    return logActionError("subscribeToNewsletter", err, "Could not subscribe. Try again.");
  }

  return { ok: true, message: "Thanks — we'll be in touch once there's news to share." };
}

/**
 * Sends one real campaign to every active newsletter subscriber (footer
 * signups and members with the newsletter toggle on) via a Resend
 * Broadcast. Re-syncs every subscriber into the Resend audience first —
 * best-effort and idempotent — so anyone who subscribed before this
 * feature existed, or whose earlier sync attempt failed, is still covered.
 * Sequential, not parallel: this only runs when an admin deliberately
 * clicks Send, and staying under Resend's per-second rate limit matters
 * more than shaving a few seconds off a list this size.
 */
export async function sendNewsletterCampaign(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const limited = checkRateLimit(`${admin.id}:sendNewsletterCampaign`, 5, 60 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject) return { ok: false, error: "Enter a subject." };
  if (!body) return { ok: false, error: "Enter a message." };

  const resend = getResendClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY isn't set — see the Vercel environment variables." };

  const audienceId = await getOrCreateAudienceId();
  if (!audienceId) return { ok: false, error: "Could not reach Resend to set up the newsletter audience." };

  try {
    const [footerSubscribers, newsletterMembers] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where: { unsubscribedAt: null },
        select: { email: true },
      }),
      prisma.user.findMany({
        where: { emailNewsletter: true },
        select: { email: true, firstName: true },
      }),
    ]);

    // Keyed by lowercased email so an old case-variant duplicate (e.g. from
    // before parseContactEmail lowercased on the way in) is only synced
    // once, not sent the campaign twice under two different-cased contacts.
    const uniqueByEmail = new Map<string, string | null>();
    for (const subscriber of footerSubscribers) {
      uniqueByEmail.set(subscriber.email.toLowerCase(), null);
    }
    for (const member of newsletterMembers) {
      uniqueByEmail.set(member.email.toLowerCase(), member.firstName);
    }
    for (const [email, firstName] of uniqueByEmail) {
      await syncContactSubscribed(email, firstName);
    }

    const brand = await getEmailBrand();
    const { error } = await resend.broadcasts.create({
      name: `Newsletter — ${subject}`,
      from: fromAddress(),
      subject,
      segmentId: audienceId,
      react: NewsletterCampaignEmail({ ...brand, heading: subject, bodyParagraphs: paragraphsFrom(body) }),
      send: true,
    });
    if (error) {
      console.error("sendNewsletterCampaign: Resend rejected the broadcast", error);
      return { ok: false, error: "Resend rejected the campaign. Try again." };
    }
  } catch (err) {
    return logActionError("sendNewsletterCampaign", err, "Could not send the newsletter. Try again.");
  }

  return { ok: true, message: "Newsletter sent." };
}

/** Lets an admin remove a footer-form subscriber — e.g. a case-variant
 * duplicate from before parseContactEmail lowercased addresses on the way
 * in, or someone who asked to be removed some other way than the
 * one-click unsubscribe link. Also removes them from the Resend audience. */
export async function removeNewsletterSubscriber(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "No subscriber selected." };

  try {
    const subscriber = await prisma.newsletterSubscriber.delete({
      where: { id },
      select: { email: true },
    });
    await syncContactUnsubscribed(subscriber.email);
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: true, message: "Already removed." };
    return logActionError("removeNewsletterSubscriber", err, "Could not remove that subscriber. Try again.");
  }

  revalidatePath("/admin/settings/subscribers");
  return { ok: true, message: "Subscriber removed." };
}

/** Powers the one-click unsubscribe link in every newsletter email's footer. */
export async function unsubscribeFromNewsletter(token: string): Promise<boolean> {
  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { unsubscribeToken: token },
      data: { unsubscribedAt: new Date() },
      select: { email: true },
    });
    await syncContactUnsubscribed(subscriber.email);
    return true;
  } catch {
    return false;
  }
}
