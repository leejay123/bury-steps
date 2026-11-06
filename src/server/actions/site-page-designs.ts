"use server";

import { z } from "zod";
import { guardArgs } from "@/lib/safe-action";
import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import {
  ensureContactForm,
  ensureHomeHero,
  isPuckData,
  isSitePageKey,
  parseSitePageDesigns,
  SITE_PAGE_DESIGNS_TAG,
  publicPathFor,
  type SitePageKey,
} from "@/lib/site-page-designs";
import { defaultContactForm, defaultHomeHero } from "@/lib/site-page-copy";
import { type ActionResult, logActionError, permissionDenied } from "./shared";

function constrain(page: SitePageKey, data: unknown) {
  if (!isPuckData(data)) return data;
  if (page === "home") return ensureHomeHero(data, defaultHomeHero());
  if (page === "contact") return ensureContactForm(data, defaultContactForm());
  return data;
}

async function writeSlot(
  page: SitePageKey,
  patch: { draft?: unknown; published?: unknown },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { sitePageDesigns: true },
    });
    const designs = parseSitePageDesigns(row?.sitePageDesigns);
    const current = designs[page];
    designs[page] = {
      draft: patch.draft !== undefined ? patch.draft : current.draft,
      published: patch.published !== undefined ? patch.published : current.published,
    };
    const text = JSON.stringify(designs);
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, sitePageDesigns: text },
      update: { sitePageDesigns: text },
    });
  } catch (err) {
    return logActionError("saveSitePageDesign", err, "Could not save the design. Try again.");
  }
  revalidateTag(SITE_PAGE_DESIGNS_TAG, { expire: 0 });
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/page-designs");
  revalidatePath(publicPathFor(page));
  if (page === "privacy") revalidatePath("/privacy");
  if (page === "home") revalidatePath("/", "layout");
  return { ok: true, message: "Design saved." };
}

async function saveSitePageDraftWork(input: { page: string; data: string }): Promise<ActionResult> {
  if (!isSitePageKey(input.page)) return { ok: false, error: "That page isn't in the designer." };
  let design: unknown;
  try {
    design = JSON.parse(input.data);
  } catch {
    return { ok: false, error: "That design couldn't be read. Try again." };
  }
  const result = await writeSlot(input.page, { draft: constrain(input.page, design) });
  if (result.ok) result.message = "Draft saved.";
  return result;
}

async function publishSitePageDesignWork(input: { page: string; data: string }): Promise<ActionResult> {
  if (!isSitePageKey(input.page)) return { ok: false, error: "That page isn't in the designer." };
  let design: unknown;
  try {
    design = JSON.parse(input.data);
  } catch {
    return { ok: false, error: "That design couldn't be read. Try again." };
  }
  const next = constrain(input.page, design);
  const result = await writeSlot(input.page, { draft: next, published: next });
  if (result.ok) result.message = "Design published. The live page now uses it.";
  return result;
}

const payload = z.object({
  page: z.string().max(20),
  data: z.string().max(800_000, "That design is too big to save."),
});

const saveSitePageDraftGuarded = guardArgs("organiser", payload, (value) =>
  saveSitePageDraftWork(value as { page: string; data: string }),
);
const publishSitePageDesignGuarded = guardArgs("organiser", payload, (value) =>
  publishSitePageDesignWork(value as { page: string; data: string }),
);

export async function saveSitePageDraft(page: string, data: string): Promise<ActionResult> {
  return saveSitePageDraftGuarded({ page, data });
}

export async function publishSitePageDesign(page: string, data: string): Promise<ActionResult> {
  return publishSitePageDesignGuarded({ page, data });
}
