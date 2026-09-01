"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { customAlphabet } from "nanoid";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  MAX_NOTICE_CATEGORIES,
  MAX_NOTICE_CATEGORY_LABEL,
  MAX_NOTICE_TITLE,
  MAX_NOTICE_BELL_BODY,
  MAX_NOTICE_TEASER,
  MAX_NOTICE_PAGE_BODY,
  noticeCategorySlug,
  noticePageSlug,
  noticesForBell,
} from "@/lib/notices";
import { NOTICES_CACHE_TAG, recordSiteNoticeRead } from "@/lib/site-notices";
import { checkRateLimit } from "@/lib/rate-limit";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  isPrismaCode,
  logActionError,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

const slugSuffix = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 6);

function revalidateNotices(paths: string[] = []) {
  revalidateTag(NOTICES_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/notices");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/notices");
  for (const path of paths) revalidatePath(path);
}

async function uniqueNoticeCategorySlug(
  tx: Prisma.TransactionClient,
  label: string,
): Promise<string> {
  const base = noticeCategorySlug(label);
  for (let n = 0; n < 25; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const taken = await tx.siteNoticeCategory.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uniqueNoticePageSlug(
  tx: Prisma.TransactionClient,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = noticePageSlug(title);
  // Random suffix (like walk share slugs) so /notices/{slug} cannot be guessed
  // from the title alone.
  for (let n = 0; n < 25; n++) {
    const slug = `${base}-${slugSuffix()}`;
    const taken = await tx.siteNotice.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function readNoticeCopy(
  formData: FormData,
  options: { maxBody: number } = { maxBody: MAX_NOTICE_BELL_BODY },
):
  | {
      title: string;
      body: string;
      kind: "BELL" | "PAGE";
      pageBody: string | null;
      categoryId: string | null;
    }
  | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "BELL").trim().toUpperCase();
  const kind = kindRaw === "PAGE" ? "PAGE" : "BELL";
  const pageBody = String(formData.get("pageBody") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;

  if (!title) return { error: "Add a title." };
  if (!body) return { error: "Add a short message for the bell." };
  if (title.length > MAX_NOTICE_TITLE) {
    return { error: `Keep the title under ${MAX_NOTICE_TITLE} characters.` };
  }
  if (body.length > options.maxBody) {
    return { error: `Keep the bell message under ${options.maxBody} characters.` };
  }

  if (kind === "PAGE") {
    if (!categoryId) return { error: "Choose a category for a full-page notice." };
    if (!pageBody) return { error: "Add the full page text." };
    if (pageBody.length > MAX_NOTICE_PAGE_BODY) {
      return { error: `Keep the page under ${MAX_NOTICE_PAGE_BODY} characters.` };
    }
    return { title, body, kind, pageBody, categoryId };
  }

  return { title, body, kind: "BELL", pageBody: null, categoryId: null };
}

export async function addSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const copy = readNoticeCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    let createdSlug: string | null = null;
    await prisma.$transaction(async (tx) => {
      if (copy.kind === "PAGE" && copy.categoryId) {
        const category = await tx.siteNoticeCategory.findUnique({
          where: { id: copy.categoryId },
          select: { id: true },
        });
        if (!category) throw new Error("CATEGORY_MISSING");
      }
      const slug =
        copy.kind === "PAGE" ? await uniqueNoticePageSlug(tx, copy.title) : null;
      createdSlug = slug;
      await tx.siteNotice.create({
        data: {
          title: copy.title,
          body: copy.body,
          kind: copy.kind,
          audience: "MEMBERS",
          slug,
          pageBody: copy.pageBody,
          categoryId: copy.categoryId,
        },
      });
    });
    revalidateNotices(createdSlug ? [`/notices/${createdSlug}`] : []);
  } catch (err) {
    if (err instanceof Error && err.message === "CATEGORY_MISSING") {
      return { ok: false, error: "That category is no longer there." };
    }
    return logActionError("addSiteNotice", err, "Could not add that notice. Try again.");
  }

  return {
    ok: true,
    message:
      copy.kind === "PAGE"
        ? "Full-page notice added. Members will see it in the bell and on Notices."
        : "Notice added. Members will see it in the bell.",
  };
}

export async function updateSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("noticeId") ?? "");
  if (!id) return { ok: false, error: "No notice selected." };

  const existingForLimit = await prisma.siteNotice.findUnique({
    where: { id },
    select: { systemKey: true },
  });
  if (!existingForLimit) return { ok: false, error: "That notice is no longer there." };

  const copy = readNoticeCopy(formData, {
    maxBody: existingForLimit.systemKey ? MAX_NOTICE_TEASER : MAX_NOTICE_BELL_BODY,
  });
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    let slugPath: string | null = null;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.siteNotice.findUnique({
        where: { id },
        select: { id: true, slug: true, systemKey: true },
      });
      if (!existing) throw new Error("MISSING");

      // Pinned system notices stay bell-only; organisers may edit title and body.
      const kind = existing.systemKey ? "BELL" : copy.kind;
      const pageBody = existing.systemKey ? null : copy.pageBody;
      const categoryId = existing.systemKey ? null : copy.categoryId;

      if (kind === "PAGE" && categoryId) {
        const category = await tx.siteNoticeCategory.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });
        if (!category) throw new Error("CATEGORY_MISSING");
      }

      const slug =
        kind === "PAGE"
          ? existing.slug ?? (await uniqueNoticePageSlug(tx, copy.title, id))
          : null;
      if (slug) slugPath = `/notices/${slug}`;
      if (existing.slug && existing.slug !== slug) {
        slugPath = slugPath ?? `/notices/${existing.slug}`;
      }

      await tx.siteNotice.update({
        where: { id },
        data: {
          title: copy.title,
          body: copy.body,
          kind,
          audience: "MEMBERS",
          slug,
          pageBody,
          categoryId,
        },
      });
      await tx.siteNoticeRead.deleteMany({ where: { noticeId: id } });
    });
    revalidateNotices(slugPath ? [slugPath] : []);
  } catch (err) {
    if (err instanceof Error && err.message === "CATEGORY_MISSING") {
      return { ok: false, error: "That category is no longer there." };
    }
    if (err instanceof Error && err.message === "MISSING") {
      return { ok: false, error: "That notice is no longer there." };
    }
    if (!isPrismaCode(err, "P2025")) logActionError("updateSiteNotice", err);
    return { ok: false, error: "That notice is no longer there." };
  }

  return { ok: true, message: "Notice updated. Members will see it as recently updated." };
}

export async function deleteSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("noticeId") ?? "");
  if (!id) return { ok: false, error: "No notice selected." };

  try {
    const existing = await prisma.siteNotice.findUnique({
      where: { id },
      select: { systemKey: true },
    });
    if (!existing) return { ok: false, error: "That notice is no longer there." };
    if (existing.systemKey) {
      return { ok: false, error: "That notice is pinned and cannot be removed." };
    }
    await prisma.siteNotice.delete({ where: { id } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteSiteNotice", err);
    return { ok: false, error: "That notice is no longer there." };
  }

  revalidateNotices();
  return { ok: true, message: "Notice removed." };
}

export async function setSiteNoticeEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("noticeId") ?? "");
  if (!id) return { ok: false, error: "No notice selected." };

  const enabled = formData.get("enabled") === "on";

  try {
    const existing = await prisma.siteNotice.findUnique({
      where: { id },
      select: { id: true, systemKey: true },
    });
    if (!existing) return { ok: false, error: "That notice is no longer there." };
    if (!existing.systemKey) {
      return { ok: false, error: "Only the pinned welcome notice can be turned off." };
    }
    await prisma.siteNotice.update({
      where: { id },
      data: { enabled },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("setSiteNoticeEnabled", err);
    return { ok: false, error: "That notice is no longer there." };
  }

  revalidateNotices();
  return {
    ok: true,
    message: enabled
      ? "Welcome notice is on in the bell."
      : "Welcome notice is hidden from the bell.",
  };
}

export async function markSiteNoticesRead(): Promise<ActionResult> {
  const user = await requireUser();

  const limited = checkRateLimit(`${user.id}:markSiteNoticesRead`, 20, 60_000);
  if (!limited.ok) return { ok: false, error: "Try again in a moment." };

  try {
    const rows = await prisma.siteNotice.findMany({
      select: {
        id: true,
        title: true,
        body: true,
        kind: true,
        audience: true,
        slug: true,
        pageBody: true,
        categoryId: true,
        systemKey: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const bell = noticesForBell(
      rows.map((row) => ({
        ...row,
        categoryLabel: null,
      })),
    );
    if (bell.length === 0) return { ok: true };

    await prisma.siteNoticeRead.createMany({
      data: bell.map((notice) => ({ noticeId: notice.id, userId: user.id })),
      skipDuplicates: true,
    });
  } catch (err) {
    return logActionError("markSiteNoticesRead", err, "Could not mark notices as read. Try again.");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markSiteNoticeRead(noticeId: string): Promise<ActionResult> {
  const user = await requireUser();
  const id = noticeId.trim();
  if (!id) return { ok: false, error: "No notice selected." };

  const limited = checkRateLimit(`${user.id}:markSiteNoticeRead`, 40, 60_000);
  if (!limited.ok) return { ok: false, error: "Try again in a moment." };

  try {
    const notice = await prisma.siteNotice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!notice) return { ok: false, error: "That notice is no longer there." };
    await recordSiteNoticeRead(user.id, id);
  } catch (err) {
    return logActionError("markSiteNoticeRead", err, "Could not mark that notice as read. Try again.");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

function readNoticeCategoryLabel(formData: FormData): { label: string } | { error: string } {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Add a category name." };
  if (label.length > MAX_NOTICE_CATEGORY_LABEL) {
    return { error: `Keep the name under ${MAX_NOTICE_CATEGORY_LABEL} characters.` };
  }
  return { label };
}

export async function addSiteNoticeCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const copy = readNoticeCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.siteNoticeCategory, async (tx) => {
      const count = await tx.siteNoticeCategory.count();
      if (count >= MAX_NOTICE_CATEGORIES) {
        throw new LimitReachedError(`You can have up to ${MAX_NOTICE_CATEGORIES} categories.`);
      }
      await tx.siteNoticeCategory.create({
        data: {
          label: copy.label,
          slug: await uniqueNoticeCategorySlug(tx, copy.label),
          sortOrder: count,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    return logActionError("addSiteNoticeCategory", err, "Could not add that category. Try again.");
  }

  revalidateNotices();
  return { ok: true, message: "Category added." };
}

export async function updateSiteNoticeCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };
  const copy = readNoticeCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.siteNoticeCategory.update({
      where: { id },
      data: { label: copy.label },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateSiteNoticeCategory", err);
    return { ok: false, error: "That category is no longer there." };
  }

  revalidateNotices();
  return { ok: true, message: "Category updated." };
}

export async function deleteSiteNoticeCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.siteNoticeCategory, async (tx) => {
      const category = await tx.siteNoticeCategory.findUnique({
        where: { id },
        select: { id: true, _count: { select: { notices: true } } },
      });
      if (!category) throw new Error("CATEGORY_GONE");

      const remaining = await tx.siteNoticeCategory.count();
      if (remaining <= 1) {
        throw new LimitReachedError("Keep at least one category.");
      }
      if (category._count.notices > 0) {
        throw new LimitReachedError("Move or remove the notices in this category first.");
      }

      await tx.siteNoticeCategory.delete({ where: { id } });

      const leftover = await tx.siteNoticeCategory.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      for (const [index, row] of leftover.entries()) {
        await tx.siteNoticeCategory.update({
          where: { id: row.id },
          data: { sortOrder: index },
        });
      }
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "CATEGORY_GONE") {
      return { ok: false, error: "That category is no longer there." };
    }
    return logActionError("deleteSiteNoticeCategory", err, "Could not remove that category. Try again.");
  }

  revalidateNotices();
  return { ok: true, message: "Category removed." };
}

export async function reorderSiteNoticeCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_NOTICE_CATEGORIES * 2);
  if ("error" in validated) return { ok: false, error: validated.error };

  try {
    const existing = await prisma.siteNoticeCategory.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((row) => row.id));
    if (
      validated.length !== existingIds.size ||
      validated.some((id) => !existingIds.has(id))
    ) {
      return { ok: false, error: "Categories changed. Refresh and try again." };
    }
    await Promise.all(
      validated.map((id, sortOrder) =>
        prisma.siteNoticeCategory.update({ where: { id }, data: { sortOrder } }),
      ),
    );
  } catch (err) {
    return logActionError(
      "reorderSiteNoticeCategories",
      err,
      "Could not reorder categories. Try again.",
    );
  }

  revalidateNotices();
  return { ok: true };
}
