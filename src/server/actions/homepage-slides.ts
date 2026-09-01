"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  applySortOrder,
  isPrismaCode,
  logActionError,
  readOptionalImage,
  readSlideImage,
  revalidateHomepage,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

export async function addHomepageSlide(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const image = await readSlideImage(formData);
  if ("error" in image) return { ok: false, error: image.error };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || "Bury Steps Walking Group";

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageSlide, async (tx) => {
      const count = await tx.homepageSlide.count();
      if (count >= MAX_HOMEPAGE_SLIDES) {
        throw new LimitReachedError("You can have up to 3 slides.");
      }
      await tx.homepageSlide.create({
        data: {
          sortOrder: count,
          alt,
          imagePath: null,
          imageMime: image.mime,
          imageData: image.data,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    return logActionError("addHomepageSlide", err, "Could not add that slide. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "Slide added." };
}

export async function replaceHomepageSlideImage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("slideId") ?? "");
  if (!id) return { ok: false, error: "No slide selected." };

  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || "Bury Steps Walking Group";

  try {
    await prisma.homepageSlide.update({
      where: { id },
      data: {
        alt,
        ...(image
          ? { imagePath: null, imageMime: image.mime, imageData: image.data }
          : {}),
      },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("replaceHomepageSlideImage", err);
    return { ok: false, error: "That slide is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Slide saved." };
}

export async function deleteHomepageSlide(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("slideId") ?? "");
  if (!id) return { ok: false, error: "No slide selected." };

  try {
    await prisma.homepageSlide.delete({ where: { id } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteHomepageSlide", err);
    return { ok: false, error: "That slide is no longer there." };
  }

  try {
    const remaining = await prisma.homepageSlide.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((slide, index) =>
        prisma.homepageSlide.update({ where: { id: slide.id }, data: { sortOrder: index } }),
      ),
    );
  } catch (err) {
    // The slide itself is already gone at this point — only the resort
    // failed, so log it but don't tell the admin the removal failed.
    logActionError("deleteHomepageSlide:resort", err);
  }

  revalidateHomepage();
  return { ok: true, message: "Slide removed." };
}

export async function reorderHomepageSlides(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_HOMEPAGE_SLIDES * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageSlide.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageSlide.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageSlides", err, "Could not save that order. Try again.");
  }
  revalidateHomepage();
  return { ok: true };
}
