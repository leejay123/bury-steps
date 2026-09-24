"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EmailPreferences } from "@/lib/email-preferences";
import { syncNewsletterAudienceToPreference } from "@/lib/email/newsletter-opt-out";
import { checkRateLimit } from "@/lib/rate-limit";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

/** `isAdmin` decides whether the organiser-only toggle is read at all. It
 * isn't rendered for a plain member, so reading it would always write
 * false — silently switching off the default-on accident alerts they'd
 * otherwise get if they were ever made an organiser. */
function readPreferences(
  formData: FormData,
  isAdmin: boolean,
): Omit<EmailPreferences, "emailAccidentAlerts"> & Partial<Pick<EmailPreferences, "emailAccidentAlerts">> {
  return {
    emailWalkAnnouncements: formData.get("emailWalkAnnouncements") === "on",
    emailNotices: formData.get("emailNotices") === "on",
    emailProgress: formData.get("emailProgress") === "on",
    emailNewsletter: formData.get("emailNewsletter") === "on",
    ...(isAdmin ? { emailAccidentAlerts: formData.get("emailAccidentAlerts") === "on" } : {}),
  };
}

/** Public /email-preferences/[token] page, reached from an email footer link
 * — no sign-in required, since the whole point is a member can manage
 * preferences without needing to log in first. */
export async function updateMemberEmailPreferences(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "This link is missing its token." };

  // Token is unguessable (24 chars), but still throttle guess-and-check /
  // scripted form spam on the public preferences page.
  const limited = checkRateLimit(`emailPrefs:${token}`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  try {
    const before = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { role: true },
    });
    if (!before) return { ok: false, error: "This link is invalid or has expired." };

    const preferences = readPreferences(formData, before.role === "ADMIN");
    const updated = await prisma.user.update({
      where: { unsubscribeToken: token },
      data: preferences,
      select: { email: true, firstName: true },
    });
    // Re-read + align footer/Resend to the final DB value — concurrent tabs
    // that both started from "off" must not leave Resend subscribed after a
    // later save writes "off" without a flip detection.
    await syncNewsletterAudienceToPreference(updated.email, updated.firstName);
  } catch (err) {
    if (isPrismaCode(err, "P2025")) {
      return { ok: false, error: "This link is invalid or has expired." };
    }
    return logActionError("updateMemberEmailPreferences", err, "Could not save your preferences. Try again.");
  }

  return { ok: true, message: "Your email preferences have been saved." };
}

/** Authenticated /email-preferences page, reached from the account menu —
 * acts on the signed-in member directly, no token needed. */
export async function updateMyEmailPreferences(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const limited = checkRateLimit(`${user.id}:emailPrefs`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }
  const preferences = readPreferences(formData, user.role === "ADMIN");

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: preferences,
      select: { email: true, firstName: true },
    });
    await syncNewsletterAudienceToPreference(updated.email, updated.firstName);
  } catch (err) {
    return logActionError("updateMyEmailPreferences", err, "Could not save your preferences. Try again.");
  }

  return { ok: true, message: "Your email preferences have been saved." };
}
