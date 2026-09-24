"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { requesterIpKey } from "@/lib/requester-ip";
import { parseContactEmail } from "@/lib/contact";
import { getEmailBrand } from "@/lib/email/brand";
import { getResendClient, fromAddress } from "@/lib/email/client";
import { sendNewsletterSubscribedEmail } from "@/lib/email/mailer";
import { paragraphsFrom } from "@/lib/email/render-template";
import { getOrCreateAudienceId, syncContactSubscribed, syncContactUnsubscribed } from "@/lib/email/resend-audience";
import { SITE_SETTING_ID } from "@/lib/theme";
import { optOutNewsletterEverywhere } from "@/lib/email/newsletter-opt-out";
import { NewsletterCampaignEmail } from "@/lib/email/templates/newsletter-campaign";
import { makeCapabilityToken } from "@/lib/email/unsubscribe";
import { actorStillOwner } from "@/lib/site-owner";
import {
  type ActionResult,
  ensureStillOwner,
  isPrismaCode,
  logActionError,
  ownerDenied,
  permissionDenied,
} from "./shared";

export async function subscribeToNewsletter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Same honeypot pattern as the contact form — a hidden field a real
  // visitor never sees or fills in.
  if (String(formData.get("company") ?? "").trim().length > 0) {
    return { ok: true, message: "Thanks — we'll be in touch." };
  }

  // Footer form is members-only (see SiteFooter). Reject anonymous posts
  // even if someone crafts a request without the UI.
  const member = await getOptionalUser();
  if (!member) {
    return { ok: false, error: "Sign in to subscribe to the newsletter." };
  }

  const key = await requesterIpKey();
  const limited = checkRateLimit(`${key}:subscribeToNewsletter`, 5, 10 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  // Always the signed-in member’s account email — never trust a posted
  // address (that would let any member force-subscribe someone else).
  const email = parseContactEmail(member.email);
  if (email === "invalid") {
    return { ok: false, error: "Your account email is not valid for the newsletter. Update it in your account first." };
  }

  try {
    // Create-first avoids the old findUnique→upsert race: two concurrent
    // new signups for the same address used to both "update" and rotate the
    // active unsubscribe token (breaking the first confirmation email).
    const token = makeCapabilityToken();
    let subscriber: { email: string; unsubscribeToken: string };
    try {
      subscriber = await prisma.newsletterSubscriber.create({
        data: { email, unsubscribeToken: token },
        select: { email: true, unsubscribeToken: true },
      });
    } catch (err) {
      if (!isPrismaCode(err, "P2002")) throw err;
      // Row already exists — only reactivate if they had unsubscribed.
      // updateMany keyed on unsubscribedAt means a double-click on an
      // already-active address is a no-op (no second confirmation email).
      const newToken = makeCapabilityToken();
      const reactivated = await prisma.newsletterSubscriber.updateMany({
        where: { email, unsubscribedAt: { not: null } },
        data: { unsubscribedAt: null, unsubscribeToken: newToken },
      });
      if (reactivated.count === 0) {
        // Same success copy as a new signup — do not reveal whether the
        // address was already on the list (email enumeration).
        return { ok: true, message: "Thanks — we'll be in touch once there's news to share." };
      }
      subscriber = { email, unsubscribeToken: newToken };
    }

    await Promise.all([
      sendNewsletterSubscribedEmail(subscriber).catch((err) => {
        console.error("subscribeToNewsletter: failed to send confirmation email", err);
      }),
      // Footer list + Resend only — do not flip User.emailNewsletter. The
      // form is members-only and bound to their account email, but prefs
      // remain the intentional toggle for the member store; campaigns already
      // union active footer subscribers with opted-in members.
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
 * Run in parallel: a walking group's list is realistically dozens of
 * people at most, well under Resend's rate limit even all at once, and
 * doing them one-by-one made sending to even a handful of people feel
 * slow for no real benefit.
 */
async function loadCampaignRecipients(): Promise<{
  recipients: Map<string, string | null>;
  footerUnsubscribed: Set<string>;
}> {
  const [footerSubscribers, newsletterMembers, optedOutFooter] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true },
    }),
    prisma.user.findMany({
      where: { emailNewsletter: true },
      select: { email: true, firstName: true },
    }),
    // Real unsubscribe signal only — User.emailNewsletter defaults to false
    // for every account, which is "never opted into the member toggle", not
    // "opted out of newsletter". Treating default-off as blocked would skip
    // active footer subscribers who also have a User row.
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: { not: null } },
      select: { email: true },
    }),
  ]);

  const footerUnsubscribed = new Set(
    optedOutFooter.map((row) => row.email.toLowerCase()),
  );
  // Keyed by lowercased email so an old case-variant duplicate (e.g. from
  // before parseContactEmail lowercased on the way in) is only synced
  // once, not sent the campaign twice under two different-cased contacts.
  const recipients = new Map<string, string | null>();
  for (const subscriber of footerSubscribers) {
    recipients.set(subscriber.email.toLowerCase(), null);
  }
  for (const member of newsletterMembers) {
    const key = member.email.toLowerCase();
    // Mirror-lag defense: footer unsubscribe wins over a stale member toggle.
    if (footerUnsubscribed.has(key)) continue;
    recipients.set(key, member.firstName);
  }
  return { recipients, footerUnsubscribed };
}

export async function sendNewsletterCampaign(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permSubscribers) return permissionDenied("permSubscribers");
  const lostOwner = await ensureStillOwner(admin.id, "send a newsletter campaign");
  if (lostOwner) return lostOwner;
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
    const initial = await loadCampaignRecipients();
    // Resend's Contacts API has no batch/bulk endpoint (unlike /emails/batch
    // — see sendEmailBatch in lib/email/client.ts), so this stays one
    // request per contact. A small chunk of concurrent requests at a time,
    // rather than firing every contact at once via a single Promise.all,
    // keeps a large subscriber list from bursting well past Resend's
    // ~10-requests/second rate limit (https://resend.com/docs/api-reference/rate-limit).
    const CONTACT_SYNC_CHUNK_SIZE = 10;
    const contacts = [...initial.recipients];
    for (let i = 0; i < contacts.length; i += CONTACT_SYNC_CHUNK_SIZE) {
      if (!(await actorStillOwner(admin.id))) {
        return ownerDenied("send a newsletter campaign");
      }
      const chunk = contacts.slice(i, i + CONTACT_SYNC_CHUNK_SIZE);
      // Fresh read per chunk — a concurrent opt-out after the snapshot must
      // not be force-subscribed back into Resend before the broadcast.
      const fresh = await loadCampaignRecipients();
      await Promise.all(
        chunk.map(([email, firstName]) => {
          if (!fresh.recipients.has(email)) return syncContactUnsubscribed(email);
          return syncContactSubscribed(email, fresh.recipients.get(email) ?? firstName);
        }),
      );
    }

    // Drop anyone who must not receive this broadcast from the Resend
    // segment before creating it — a stale contact (failed prior opt-out
    // sync, or member-toggle off with no footer row) would still get it.
    const final = await loadCampaignRecipients();
    const blockedEmails = new Set(final.footerUnsubscribed);
    const optedOutMembers = await prisma.user.findMany({
      where: { emailNewsletter: false },
      select: { email: true },
    });
    for (const row of optedOutMembers) {
      const key = row.email.trim().toLowerCase();
      if (key && !final.recipients.has(key)) blockedEmails.add(key);
    }
    const blockedList = [...blockedEmails];
    for (let i = 0; i < blockedList.length; i += CONTACT_SYNC_CHUNK_SIZE) {
      const chunk = blockedList.slice(i, i + CONTACT_SYNC_CHUNK_SIZE);
      await Promise.all(chunk.map((email) => syncContactUnsubscribed(email)));
    }

    // Ownership can be revoked during a long contact sync — abort before
    // the irreversible broadcast if the actor is no longer an owner.
    if (!(await actorStillOwner(admin.id))) {
      return ownerDenied("send a newsletter campaign");
    }

    if (final.recipients.size === 0) {
      return {
        ok: false,
        error: "Nobody is opted into the newsletter right now — nothing was sent.",
      };
    }

    // Site reset (or another warm instance) may have nulled/replaced the
    // Resend segment while we were syncing contacts against `audienceId`.
    // Re-read the DB id — do not create a replacement here — and refuse to
    // broadcast to a pre-wipe segment.
    const setting = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { resendAudienceId: true },
    });
    if (!setting?.resendAudienceId || setting.resendAudienceId !== audienceId) {
      return {
        ok: false,
        error: "The newsletter audience changed while sending — try again.",
      };
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
  const admin = await requireAdmin();
  if (!admin.permSubscribers) return permissionDenied("permSubscribers");
  const lostOwner = await ensureStillOwner(admin.id, "remove a newsletter subscriber");
  if (lostOwner) return lostOwner;
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "No subscriber selected." };

  try {
    const subscriber = await prisma.newsletterSubscriber.delete({
      where: { id },
      select: { email: true },
    });
    await optOutNewsletterEverywhere(subscriber.email);
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: true, message: "Already removed." };
    return logActionError("removeNewsletterSubscriber", err, "Could not remove that subscriber. Try again.");
  }

  revalidatePath("/admin/settings/subscribers");
  return { ok: true, message: "Subscriber removed." };
}

/** Powers the one-click unsubscribe link in every newsletter email's footer.
 * Prefer {@link confirmNewsletterUnsubscribe} from the confirm page so Safe
 * Links scanners cannot unsubscribe someone on a mere GET. */
export async function unsubscribeFromNewsletter(token: string): Promise<boolean> {
  if (!token) return false;
  const limited = checkRateLimit(`newsletterUnsub:${token}`, 20, 60_000);
  if (!limited.ok) return false;

  try {
    // Only the first call wins — a double Safe Links prefetch must not keep
    // rewriting unsubscribedAt, and a second confirm should still succeed
    // idempotently once they are already off the list.
    const claimed = await prisma.newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    if (claimed.count === 1) {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token },
        select: { email: true },
      });
      if (subscriber) await optOutNewsletterEverywhere(subscriber.email);
      return true;
    }
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { email: true, unsubscribedAt: true },
    });
    if (existing?.unsubscribedAt) {
      // Idempotent confirm — still mirror in case a prior run only cleared
      // the footer row before crashing.
      await optOutNewsletterEverywhere(existing.email);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Form action for the public confirm-unsubscribe page. */
export async function confirmNewsletterUnsubscribe(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "This link is missing its token." };
  const ok = await unsubscribeFromNewsletter(token);
  if (!ok) return { ok: false, error: "This unsubscribe link is invalid or has already been used." };
  return { ok: true, message: "You've been unsubscribed." };
}
