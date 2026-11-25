"use server";

import { z } from "zod";
import { guardForm } from "@/lib/safe-action";

import { revalidatePath } from "@/lib/revalidate";
import { getOptionalUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { checkRateLimit } from "@/lib/rate-limit";
import { requesterIpKey } from "@/lib/requester-ip";
import {
  CONTACT_TOPICS,
  type ContactTopic,
  contactTopicRole,
  parseContactEmail,
  parseContactMessage,
  parseContactName,
  parseContactPhone,
  parseContactTopic,
} from "@/lib/contact";
import { sendContactMessageAdminAlertEmail, sendContactMessageReceivedEmail } from "@/lib/email/mailer";
import { type ActionResult, isPrismaCode, logActionError, permissionDenied } from "./shared";

/** A signed-in member's name and email for the Contact us form, so they
 * don't have to type them again. Null for visitors. */
export async function getContactFormDefaults(): Promise<{ name: string; email: string } | null> {
  const user = await getOptionalUser();
  if (!user) return null;
  return { name: [user.firstName, user.lastName].filter(Boolean).join(" "), email: user.email };
}

async function submitContactMessageWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Honeypot: a real visitor never fills in this hidden field. Bots that
  // blindly fill every input do — reject without a specific error so they
  // learn nothing, and don't count it against the rate limit either way.
  if (String(formData.get("company") ?? "").trim().length > 0) {
    return { ok: true, message: "Thanks — we'll get back to you soon." };
  }

  const name = parseContactName(String(formData.get("name") ?? ""));
  const email = parseContactEmail(String(formData.get("email") ?? ""));
  const phone = parseContactPhone(String(formData.get("phone") ?? ""));
  const message = parseContactMessage(String(formData.get("message") ?? ""));
  const topic = parseContactTopic(String(formData.get("topic") ?? ""));
  if (name === "invalid") return { ok: false, error: "Enter your name." };
  if (email === "invalid") return { ok: false, error: "Enter a valid email address." };
  if (phone === "invalid") return { ok: false, error: "Enter a valid phone number, or leave it blank." };
  if (message === "invalid") {
    return { ok: false, error: "Message needs to be at least 10 characters." };
  }

  // Counted only for messages that would actually be sent: a typo (say, a
  // too-short message) used to use up one of the three sends.
  const key = await requesterIpKey();
  const limited = checkRateLimit(`${key}:submitContactMessage`, 3, 10 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "Too many messages sent. Try again in a few minutes." };
  }

  try {
    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, message, topic },
    });
  } catch (err) {
    return logActionError("submitContactMessage", err, "Could not send that. Try again.");
  }
  // Organisers' Messages list (and its placeholder's row count) gains a row.
  revalidatePath("/admin/messages");

  // Best-effort — the message is already saved and visible in /admin/messages
  // either way, so a failed send here shouldn't turn into a user-facing error.
  await Promise.all([
    sendContactMessageReceivedEmail({ name, email, message }).catch((err) => {
      console.error("submitContactMessage: failed to send sender confirmation", err);
    }),
    notifyCommitteeOfContactMessage({ name, email, phone: phone || null, message, topic }),
  ]);

  return { ok: true, message: "Thanks — we'll get back to you soon." };
}

/** Emails the committee mailbox that matches the topic the visitor chose
 * (Settings → Site behaviour → Contact form addresses). The visitor's address
 * is the reply-to, so whoever reads the mailbox can just reply. If the saved
 * addresses can't be read, the built-in ones are used, so a message is never
 * left without an email. */
async function notifyCommitteeOfContactMessage(submission: {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  topic: ContactTopic;
}): Promise<void> {
  try {
    const setting = await prisma.siteSetting
      .findUnique({
        where: { id: SITE_SETTING_ID },
        select: { contactChairEmail: true, contactTreasurerEmail: true, contactSecretaryEmail: true },
      })
      .catch(() => null);
    const saved: Record<ContactTopic, string | undefined> = {
      CHAIR: setting?.contactChairEmail,
      TREASURER: setting?.contactTreasurerEmail,
      SECRETARY: setting?.contactSecretaryEmail,
    };
    const fallback = CONTACT_TOPICS.find((entry) => entry.value === submission.topic)?.defaultEmail;
    const to = saved[submission.topic]?.trim() || fallback;
    if (!to) return;
    await sendContactMessageAdminAlertEmail(
      { name: submission.name, email: submission.email, phone: submission.phone, message: submission.message, sentTo: contactTopicRole(submission.topic) },
      [to],
    );
  } catch (err) {
    console.error("submitContactMessage: failed to email the committee mailbox", err);
  }
}

async function markContactMessageReadWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permMessages) return permissionDenied("permMessages");
  const id = String(formData.get("messageId") ?? "");
  if (!id) return { ok: false, error: "No message selected." };

  try {
    await prisma.contactMessage.update({ where: { id }, data: { readAt: new Date() } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("markContactMessageRead", err);
    return { ok: false, error: "That message is no longer there." };
  }

  revalidatePath("/admin/messages");
  return { ok: true, message: "Marked as read." };
}

async function deleteContactMessageWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permMessages) return permissionDenied("permMessages");
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

const contactSchema = z
  .object({
    company: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    message: z.string(),
    topic: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.company.trim().length > 0) return;
    if (parseContactName(value.name) === "invalid") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter your name.", path: ["name"] });
      return;
    }
    if (parseContactEmail(value.email) === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid email address.",
        path: ["email"],
      });
      return;
    }
    if (parseContactPhone(value.phone) === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number, or leave it blank.",
        path: ["phone"],
      });
      return;
    }
    if (parseContactMessage(value.message) === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message needs to be at least 10 characters.",
        path: ["message"],
      });
    }
  });

function readContact(formData: FormData) {
  return {
    company: String(formData.get("company") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    topic: String(formData.get("topic") ?? ""),
  };
}

const messageIdSchema = z.object({
  messageId: z.string().min(1, "No message selected."),
});

function readMessageId(formData: FormData) {
  return { messageId: String(formData.get("messageId") ?? "") };
}

export const submitContactMessage = guardForm("public", contactSchema, readContact, submitContactMessageWork);
export const markContactMessageRead = guardForm(
  "organiser",
  messageIdSchema,
  readMessageId,
  markContactMessageReadWork,
);
export const deleteContactMessage = guardForm(
  "organiser",
  messageIdSchema,
  readMessageId,
  deleteContactMessageWork,
);
