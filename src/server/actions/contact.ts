"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  parseContactEmail,
  parseContactMessage,
  parseContactName,
  parseContactPhone,
} from "@/lib/contact";
import { sendContactMessageAdminAlertEmail, sendContactMessageReceivedEmail } from "@/lib/email/mailer";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

/** Best-effort caller identity for rate-limiting an unauthenticated public
 * form — there's no signed-in user to key on here. */
async function requesterKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function submitContactMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Honeypot: a real visitor never fills in this hidden field. Bots that
  // blindly fill every input do — reject without a specific error so they
  // learn nothing, and don't count it against the rate limit either way.
  if (String(formData.get("company") ?? "").trim().length > 0) {
    return { ok: true, message: "Thanks — we'll get back to you soon." };
  }

  const key = await requesterKey();
  const limited = checkRateLimit(`${key}:submitContactMessage`, 3, 10 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "Too many messages sent. Try again in a few minutes." };
  }

  const name = parseContactName(String(formData.get("name") ?? ""));
  const email = parseContactEmail(String(formData.get("email") ?? ""));
  const phone = parseContactPhone(String(formData.get("phone") ?? ""));
  const message = parseContactMessage(String(formData.get("message") ?? ""));
  if (name === "invalid") return { ok: false, error: "Enter your name." };
  if (email === "invalid") return { ok: false, error: "Enter a valid email address." };
  if (phone === "invalid") return { ok: false, error: "Enter a valid phone number, or leave it blank." };
  if (message === "invalid") {
    return { ok: false, error: "Message needs to be at least 10 characters." };
  }

  try {
    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, message },
    });
  } catch (err) {
    return logActionError("submitContactMessage", err, "Could not send that. Try again.");
  }

  // Best-effort — the message is already saved and visible in /admin/messages
  // either way, so a failed send here shouldn't turn into a user-facing error.
  await Promise.all([
    sendContactMessageReceivedEmail({ name, email, message }).catch((err) => {
      console.error("submitContactMessage: failed to send sender confirmation", err);
    }),
    notifyAdminsOfContactMessage({ name, email, phone: phone || null, message }),
  ]);

  return { ok: true, message: "Thanks — we'll get back to you soon." };
}

async function notifyAdminsOfContactMessage(submission: {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", emailContactAlerts: true },
      select: { email: true },
    });
    await sendContactMessageAdminAlertEmail(
      submission,
      admins.map((admin) => admin.email),
    );
  } catch (err) {
    console.error("submitContactMessage: failed to notify admins", err);
  }
}

export async function markContactMessageRead(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("messageId") ?? "");
  if (!id) return { ok: false, error: "No message selected." };

  try {
    await prisma.contactMessage.update({ where: { id }, data: { readAt: new Date() } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("markContactMessageRead", err);
    return { ok: false, error: "That message is no longer there." };
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteContactMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("messageId") ?? "");
  if (!id) return { ok: false, error: "No message selected." };

  try {
    await prisma.contactMessage.delete({ where: { id } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteContactMessage", err);
    return { ok: false, error: "That message is no longer there." };
  }

  revalidatePath("/admin/messages");
  return { ok: true, message: "Message removed." };
}
