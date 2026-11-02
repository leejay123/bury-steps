import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { EmailTemplateKey } from "./registry";

/**
 * The emails the owner has switched off (Settings → Emails). Never throws:
 * if the lookup fails, everything counts as on, so a database hiccup can't
 * silently stop emails going out.
 */
export async function getDisabledEmailKeys(): Promise<Set<string>> {
  try {
    const rows = await prisma.disabledEmail.findMany({ select: { key: true } });
    return new Set(rows.map((row) => row.key));
  } catch (err) {
    console.error("getDisabledEmailKeys: failed to load switched-off emails", err);
    return new Set();
  }
}

/** Tag of the saved copy below: cleared the moment an email is switched on or off (email-templates.ts). */
export const DISABLED_EMAILS_TAG = "disabled-emails";

/**
 * The switched-off emails as a shared saved copy (the same for everyone), for the Emails
 * settings page's placeholder: each row's line differs on and off ("Off: …" can wrap to two
 * lines), so the placeholder draws the same lines as the page.
 */
export async function getSavedDisabledEmailKeys(): Promise<string[]> {
  "use cache: remote";
  cacheTag(DISABLED_EMAILS_TAG);
  cacheLife({ revalidate: 60 * 60 });
  return [...(await getDisabledEmailKeys())];
}

export async function isEmailEnabled(key: EmailTemplateKey): Promise<boolean> {
  return !(await getDisabledEmailKeys()).has(key);
}
