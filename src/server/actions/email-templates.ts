"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EMAIL_TEMPLATES, isEmailTemplateKey, type EmailTemplateKey } from "@/lib/email/registry";
import { type ActionResult, logActionError } from "./shared";

export const MAX_EMAIL_TEMPLATE_SUBJECT = 200;
export const MAX_EMAIL_TEMPLATE_BODY = 4000;

export type EmailTemplateOverrideValues = { subject: string | null; body: string | null };

/**
 * Every template's saved override, keyed for the admin page — a template
 * with no row at all comes back as `{ subject: null, body: null }`, same
 * shape as one whose fields were explicitly reset, so the page doesn't
 * need to special-case "never edited" vs. "reset".
 */
export async function getEmailTemplateOverrides(): Promise<
  Record<EmailTemplateKey, EmailTemplateOverrideValues>
> {
  await requireAdmin();
  const rows = await prisma.emailTemplateOverride.findMany({
    select: { key: true, subject: true, body: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  const result = {} as Record<EmailTemplateKey, EmailTemplateOverrideValues>;
  for (const meta of EMAIL_TEMPLATES) {
    const row = byKey.get(meta.key);
    result[meta.key] = { subject: row?.subject ?? null, body: row?.body ?? null };
  }
  return result;
}

export async function updateEmailTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  if (!isEmailTemplateKey(key)) return { ok: false, error: "Unknown email." };

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (subject.length > MAX_EMAIL_TEMPLATE_SUBJECT) {
    return { ok: false, error: `Keep the subject under ${MAX_EMAIL_TEMPLATE_SUBJECT} characters.` };
  }
  if (body.length > MAX_EMAIL_TEMPLATE_BODY) {
    return { ok: false, error: `Keep the body under ${MAX_EMAIL_TEMPLATE_BODY} characters.` };
  }

  try {
    await prisma.emailTemplateOverride.upsert({
      where: { key },
      // A blank subject isn't a real choice — leave it null so the default
      // subject applies (see resolveEmailCopy). A blank body IS a real
      // choice on some templates, so it's stored as-is, not nulled.
      create: { key, subject: subject || null, body },
      update: { subject: subject || null, body },
    });
  } catch (err) {
    return logActionError("updateEmailTemplate", err, "Could not save this email. Try again.");
  }

  revalidatePath("/admin/settings/emails");
  return { ok: true, message: "Email updated." };
}

export async function resetEmailTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  if (!isEmailTemplateKey(key)) return { ok: false, error: "Unknown email." };

  try {
    await prisma.emailTemplateOverride.deleteMany({ where: { key } });
  } catch (err) {
    return logActionError("resetEmailTemplate", err, "Could not reset this email. Try again.");
  }

  revalidatePath("/admin/settings/emails");
  return { ok: true, message: "Reset to the default wording." };
}
