import { prisma } from "@/lib/db";
import { getEmailTemplateMeta, type EmailTemplateKey } from "./registry";
import { fillPlaceholders, paragraphsFrom } from "./render-template";

export type ResolvedEmailCopy = {
  subject: string;
  /** Already placeholder-filled and split into paragraphs — render one <EmailText> per entry. */
  bodyParagraphs: string[];
};

/**
 * The effective subject/body for one send: an admin's saved override where
 * one exists, the registry's built-in default otherwise. Never throws —
 * a lookup failure (or no row at all, the common case) just falls back to
 * the default rather than blocking the email.
 */
export async function resolveEmailCopy(
  key: EmailTemplateKey,
  vars: Record<string, string>,
): Promise<ResolvedEmailCopy> {
  const meta = getEmailTemplateMeta(key);

  let override: { subject: string | null; body: string | null } | null = null;
  try {
    override = await prisma.emailTemplateOverride.findUnique({
      where: { key },
      select: { subject: true, body: true },
    });
  } catch (err) {
    console.error(`resolveEmailCopy: failed to load override for "${key}"`, err);
  }

  // Subject: an empty string isn't a meaningful choice (no email should go
  // out with a blank subject line), so it falls back to the default same
  // as an unset row does. Body: an empty string IS meaningful — two of
  // these templates default to no intro prose at all — so only an unset
  // (null) row falls back; an admin who deliberately clears the box keeps
  // it empty.
  const subjectTemplate = override?.subject?.trim() || meta.defaultSubject;
  const bodyTemplate = override?.body?.trim() ?? meta.defaultBody;

  return {
    subject: fillPlaceholders(subjectTemplate, vars),
    bodyParagraphs: paragraphsFrom(bodyTemplate).map((paragraph) => fillPlaceholders(paragraph, vars)),
  };
}
