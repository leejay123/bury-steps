"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EmailPreferences } from "@/lib/email-preferences";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

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

  try {
    await prisma.user.update({
      where: { unsubscribeToken: token },
      data: readPreferences(formData),
    });
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

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: readPreferences(formData),
    });
  } catch (err) {
    return logActionError("updateMyEmailPreferences", err, "Could not save your preferences. Try again.");
  }

  return { ok: true, message: "Your email preferences have been saved." };
}
