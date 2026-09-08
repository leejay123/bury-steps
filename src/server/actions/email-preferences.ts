"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EmailPreferences } from "@/lib/email-preferences";
import { syncContactSubscribed, syncContactUnsubscribed } from "@/lib/email/resend-audience";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

/** Only fires the Resend sync when the newsletter toggle itself actually
 * flipped — every other preference change on this form updates the same
 * row without touching the newsletter audience. */
async function syncNewsletterToggle(
  wasSubscribed: boolean,
  isSubscribed: boolean,
  email: string,
  firstName: string | null,
): Promise<void> {
  if (wasSubscribed === isSubscribed) return;
  if (isSubscribed) await syncContactSubscribed(email, firstName);
  else await syncContactUnsubscribed(email);
}

function readPreferences(formData: FormData): EmailPreferences {
  return {
    emailWalkAnnouncements: formData.get("emailWalkAnnouncements") === "on",
    emailNotices: formData.get("emailNotices") === "on",
    emailProgress: formData.get("emailProgress") === "on",
    emailNewsletter: formData.get("emailNewsletter") === "on",
    // Neither is rendered for a non-admin, so they're simply absent from
    // their FormData — harmless, since these fields are never read for a
    // MEMBER row.
    emailContactAlerts: formData.get("emailContactAlerts") === "on",
    emailAccidentAlerts: formData.get("emailAccidentAlerts") === "on",
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

  const preferences = readPreferences(formData);
  try {
    const before = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { emailNewsletter: true },
    });
    if (!before) return { ok: false, error: "This link is invalid or has expired." };

    const updated = await prisma.user.update({
      where: { unsubscribeToken: token },
      data: preferences,
      select: { email: true, firstName: true },
    });
    // Best-effort — the toggle itself is already saved above regardless of
    // whether this succeeds.
    void syncNewsletterToggle(
      before.emailNewsletter,
      preferences.emailNewsletter,
      updated.email,
      updated.firstName,
    );
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
  const preferences = readPreferences(formData);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: preferences,
    });
    void syncNewsletterToggle(user.emailNewsletter, preferences.emailNewsletter, user.email, user.firstName);
  } catch (err) {
    return logActionError("updateMyEmailPreferences", err, "Could not save your preferences. Try again.");
  }

  return { ok: true, message: "Your email preferences have been saved." };
}
