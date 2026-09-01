"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  applySortOrder,
  isPrismaCode,
  logActionError,
  readOptionalImage,
  revalidateHomepage,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

function readTestimonialCopy(
  formData: FormData,
): { name: string; role: string; quote: string } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  if (!name) return { error: "Add a name." };
  if (!quote) return { error: "Add the testimonial text." };
  if (name.length > 80) return { error: "Keep the name under 80 characters." };
  if (role.length > 120) return { error: "Keep the line under the name under 120 characters." };
  if (quote.length > 600) return { error: "Keep the testimonial under 600 characters." };
  return { name, role, quote };
}

export async function addHomepageTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const copy = readTestimonialCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageTestimonial, async (tx) => {
      const count = await tx.homepageTestimonial.count();
      if (count >= MAX_HOMEPAGE_TESTIMONIALS) {
        throw new LimitReachedError("You can have up to 12 testimonials.");
      }
      await tx.homepageTestimonial.create({
        data: {
          sortOrder: count,
          name: copy.name,
          role: copy.role,
          quote: copy.quote,
          imagePath: null,
          imageMime: image?.mime ?? null,
          imageData: image?.data ?? null,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    return logActionError("addHomepageTestimonial", err, "Could not add that testimonial. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "Testimonial added." };
}

export async function updateHomepageTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("testimonialId") ?? "");
  if (!id) return { ok: false, error: "No testimonial selected." };

  const copy = readTestimonialCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };

  try {
    await prisma.homepageTestimonial.update({
      where: { id },
      data: {
        name: copy.name,
        role: copy.role,
        quote: copy.quote,
        ...(image
          ? { imagePath: null, imageMime: image.mime, imageData: image.data }
          : formData.get("removeImage") === "on"
            ? { imagePath: null, imageMime: null, imageData: null }
            : {}),
      },
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateHomepageTestimonial", err);
    return { ok: false, error: "That testimonial is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Testimonial saved." };
}

export async function deleteHomepageTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("testimonialId") ?? "");
  if (!id) return { ok: false, error: "No testimonial selected." };

  try {
    await prisma.homepageTestimonial.delete({ where: { id } });
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteHomepageTestimonial", err);
    return { ok: false, error: "That testimonial is no longer there." };
  }

  try {
    const remaining = await prisma.homepageTestimonial.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((row, index) =>
        prisma.homepageTestimonial.update({ where: { id: row.id }, data: { sortOrder: index } }),
      ),
    );
  } catch (err) {
    logActionError("deleteHomepageTestimonial:resort", err);
  }

  revalidateHomepage();
  return { ok: true, message: "Testimonial removed." };
}

export async function reorderHomepageTestimonials(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_HOMEPAGE_TESTIMONIALS * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageTestimonial.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageTestimonial.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageTestimonials", err, "Could not save that order. Try again.");
  }
  revalidateHomepage();
  return { ok: true };
}
