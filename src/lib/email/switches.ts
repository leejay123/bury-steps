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

export async function isEmailEnabled(key: EmailTemplateKey): Promise<boolean> {
  return !(await getDisabledEmailKeys()).has(key);
}
