"use server";

import { z } from "zod";
import { guardArgs, guardForm } from "@/lib/safe-action";

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
  permissionDenied,
  readOptionalImage,
  readSlideImage,
  revalidateHomepage,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

async function addHomepageSlideWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permHomepage) return permissionDenied("permHomepage");

  const image = await readSlideImage(formData);
  if ("error" in image) return { ok: false, error: image.error };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || "Bury Steps Walking Group";
  const heading = String(formData.get("heading") ?? "").trim().slice(0, 120);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 240);

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageSlide, async (tx) => {
      const count = await tx.homepageSlide.count();
      if (count >= MAX_HOMEPAGE_SLIDES) {
        throw new LimitReachedError(`You can have up to ${MAX_HOMEPAGE_SLIDES} slides.`);
      }
      await tx.homepageSlide.create({
        data: {
          sortOrder: count,
          alt,
          heading,
          caption,
          imagePath: null,
          imageMime: image.mime,
          imageData: image.data,
          imageBlur: image.blur,
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

async function replaceHomepageSlideImageWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permHomepage) return permissionDenied("permHomepage");
  const id = String(formData.get("slideId") ?? "");
  if (!id) return { ok: false, error: "No slide selected." };

  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || "Bury Steps Walking Group";
  const heading = String(formData.get("heading") ?? "").trim().slice(0, 120);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 240);

  try {
    await prisma.homepageSlide.update({
      where: { id },
      data: {
        alt,
        heading,
        caption,
        ...(image
          ? { imagePath: null, imageMime: image.mime, imageData: image.data, imageBlur: image.blur }
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

async function deleteHomepageSlideWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permHomepage) return permissionDenied("permHomepage");
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

async function reorderHomepageSlidesWork(ids: string[]): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permHomepage) return permissionDenied("permHomepage");
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

const pass = z.object({});
const readPass = (_formData: FormData) => ({});

const slideIdSchema = z.object({
  slideId: z.string().min(1, "No slide selected."),
});

function readSlideId(formData: FormData) {
  return { slideId: String(formData.get("slideId") ?? "") };
}

const reorderIdsSchema = z
  .array(z.string().min(1, "Could not save that order. Try again."))
  .min(1, "Could not save that order. Try again.");

export const addHomepageSlide = guardForm("organiser", pass, readPass, addHomepageSlideWork);
export const replaceHomepageSlideImage = guardForm(
  "organiser",
  slideIdSchema,
  readSlideId,
  replaceHomepageSlideImageWork,
);
export const deleteHomepageSlide = guardForm("organiser", slideIdSchema, readSlideId, deleteHomepageSlideWork);
export const reorderHomepageSlides = guardArgs("organiser", reorderIdsSchema, reorderHomepageSlidesWork);
