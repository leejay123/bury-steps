"use server";

import { prisma } from "@/lib/db";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

export async function updateMemberEmailPreferences(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "This link is missing its token." };

  try {
    await prisma.user.update({
      where: { unsubscribeToken: token },
      data: {
        emailWalkAnnouncements: formData.get("emailWalkAnnouncements") === "on",
        emailNotices: formData.get("emailNotices") === "on",
        emailProgress: formData.get("emailProgress") === "on",
        emailNewsletter: formData.get("emailNewsletter") === "on",
      },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) {
      return { ok: false, error: "This link is invalid or has expired." };
    }
    return logActionError("updateMemberEmailPreferences", err, "Could not save your preferences. Try again.");
  }

  return { ok: true, message: "Your email preferences have been saved." };
}
