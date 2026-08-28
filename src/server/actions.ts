"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, requireUser, displayName } from "@/lib/auth";
import { londonWallClockToUtc } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import {
  MAX_FAQ_CATEGORIES,
  MAX_FAQ_CATEGORY_LABEL,
  MAX_HOMEPAGE_FAQS,
  faqCategorySlug,
} from "@/lib/faqs";
import { MAX_SITE_NOTICES } from "@/lib/notices";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR, normalizeHex } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { NOTICES_CACHE_TAG } from "@/lib/site-notices";
import { isAllowedImageMime, sniffImageMime } from "@/lib/image-bytes";

/** No look-alike characters — organisers read these out loud. */
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 12);

/** How long health information is kept after the walk, in days. */
const CONDITIONS_RETENTION_DAYS = 90;

function isPrismaCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === code
  );
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// ---------------------------------------------------------------- create walk

const createWalkSchema = z.object({
  title: z.string().trim().min(3, "Give the walk a title of at least 3 characters.").max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  startsAt: z.string().min(16, "Choose a date and time."),
  durationMins: z.coerce.number().int().min(15).max(600),
});

export async function createWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = createWalkSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startsAt: formData.get("startsAt"),
    durationMins: formData.get("durationMins") ?? 90,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let startsAt: Date;
  try {
    startsAt = londonWallClockToUtc(parsed.data.startsAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  const walk = await prisma.walk.create({
    data: {
      token: makeToken(),
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      startsAt,
      durationMins: parsed.data.durationMins,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, message: `“${walk.title}” created. Share link is ready.` };
}

// ---------------------------------------------------------------- cancel walk

export async function cancelWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length > 500) {
    return { ok: false, error: "Keep the reason under 500 characters." };
  }

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: { id: true, token: true, cancelledAt: true },
  });
  if (!walk) return { ok: false, error: "That walk is no longer there." };
  if (walk.cancelledAt) return { ok: false, error: "This walk is already cancelled." };

  try {
    await prisma.walk.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancelledReason: reason || null,
      },
    });
  } catch {
    try {
      await prisma.walk.update({
        where: { id },
        data: { cancelledAt: new Date() },
      });
    } catch {
      return { ok: false, error: "Could not cancel this walk. Try again." };
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/w/${walk.token}`);
  return { ok: true, message: "Walk cancelled. Members will see it marked as cancelled." };
}

export async function reopenWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: { id: true, token: true, cancelledAt: true },
  });
  if (!walk) return { ok: false, error: "That walk is no longer there." };
  if (!walk.cancelledAt) return { ok: false, error: "This walk is already open." };

  await prisma.walk.update({
    where: { id },
    data: { cancelledAt: null, cancelledReason: null },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/w/${walk.token}`);
  return { ok: true, message: "Walk reopened. Members can clock in again if the window is still open." };
}

export async function rescheduleWalk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const parsed = z
    .object({
      startsAt: z.string().min(16, "Choose a date and time."),
      durationMins: z.coerce.number().int().min(15).max(600),
      location: z.string().trim().max(200).optional(),
      reopen: z.string().optional(),
      // Sent by the dialog that already knows this from the page it rendered
      // from — avoids a round trip to look the walk up just to re-read a
      // value the caller already had.
      wasCancelled: z.string().optional(),
    })
    .safeParse({
      startsAt: formData.get("startsAt"),
      durationMins: formData.get("durationMins") ?? 90,
      location: formData.get("location") || undefined,
      reopen: formData.get("reopen") || undefined,
      wasCancelled: formData.get("wasCancelled") || undefined,
    });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let startsAt: Date;
  try {
    startsAt = londonWallClockToUtc(parsed.data.startsAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  const wasCancelled = parsed.data.wasCancelled === "on";

  let walk: { token: string };
  try {
    walk = await prisma.walk.update({
      where: { id },
      data: {
        startsAt,
        durationMins: parsed.data.durationMins,
        location: parsed.data.location ?? null,
        ...(parsed.data.reopen === "on" || wasCancelled
          ? { cancelledAt: null, cancelledReason: null }
          : {}),
      },
      select: { token: true },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/w/${walk.token}`);
  return {
    ok: true,
    message: wasCancelled ? "Walk rescheduled and put back on the diary." : "Walk rescheduled.",
  };
}

export async function deleteWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  let walk: { token: string; title: string };
  try {
    walk = await prisma.walk.delete({
      where: { id },
      select: { token: true, title: true },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return { ok: false, error: "Could not remove this walk. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath(`/w/${walk.token}`);
  return { ok: true, message: `“${walk.title}” has been removed.` };
}

// ------------------------------------------------------------------ clock in

const clockInSchema = z.object({
  token: z.string().min(1),
  medicalAck: z.literal("on", {
    errorMap: () => ({ message: "Please confirm the medical acknowledgement before clocking in." }),
  }),
  hasConditions: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Let us know whether you have any active conditions." }),
  }),
  conditions: z.string().trim().max(1000).optional(),
});

export async function clockIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = clockInSchema.safeParse({
    token: formData.get("token"),
    medicalAck: formData.get("medicalAck"),
    hasConditions: formData.get("hasConditions"),
    conditions: formData.get("conditions") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (parsed.data.hasConditions === "yes" && !parsed.data.conditions) {
    return { ok: false, error: "Add a short note about your conditions, or select “No conditions to report”." };
  }

  const walk = await prisma.walk.findUnique({ where: { token: parsed.data.token } });
  if (!walk) return { ok: false, error: "This walk link is not valid." };
  if (walk.cancelledAt) return { ok: false, error: "This walk has been cancelled." };

  const state = windowState(walk.startsAt, walk.durationMins);
  if (state === "too-early") {
    return { ok: false, error: "Clock-in opens an hour before the walk starts." };
  }
  if (state === "closed") {
    return { ok: false, error: "Clock-in for this walk has closed. Speak to an organiser." };
  }

  const purgeAfter = new Date(
    walk.startsAt.getTime() + CONDITIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  const attendanceData = {
    medicalAckAt: new Date(),
    conditions: parsed.data.hasConditions === "yes" ? parsed.data.conditions! : null,
    conditionsPurgeAfter: purgeAfter,
    clockedOutAt: null,
    clockedOutReason: null,
  };

  // Try "clocking back in after an earlier clock-out" as a single conditional
  // write first — at most one row can match, since clocking out is the only
  // way to leave `clockedOutAt` non-null. If nothing matched, fall through to
  // create. Either way this replaces a separate read-then-write with a single
  // round trip that also does the write.
  const reclockedIn = await prisma.attendance.updateMany({
    where: { walkId: walk.id, userId: user.id, clockedOutAt: { not: null } },
    data: { ...attendanceData, clockedInAt: new Date() },
  });

  if (reclockedIn.count === 0) {
    try {
      await prisma.attendance.create({
        data: {
          walkId: walk.id,
          userId: user.id,
          // clockedInAt is set by the database default — never by the browser.
          ...attendanceData,
        },
      });
    } catch (err) {
      // P2002 = unique constraint violation, i.e. they already clocked in.
      if (isPrismaCode(err, "P2002")) {
        return { ok: false, error: "You are already clocked in for this walk." };
      }
      throw err;
    }
  }

  revalidatePath(`/w/${walk.token}`);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/walks/${walk.id}`);
  return { ok: true, message: "Clocked in. Enjoy the walk." };
}

const clockOutSchema = z.object({
  token: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Say why you are clocking out.")
    .max(500, "Keep the reason under 500 characters."),
});

export async function clockOut(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = clockOutSchema.safeParse({
    token: formData.get("token"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const walk = await prisma.walk.findUnique({
    where: { token: parsed.data.token },
    select: { id: true, token: true },
  });
  if (!walk) return { ok: false, error: "This walk link is not valid." };

  const clockedOut = await prisma.attendance.updateMany({
    where: { walkId: walk.id, userId: user.id, clockedOutAt: null },
    data: {
      clockedOutAt: new Date(),
      clockedOutReason: parsed.data.reason,
    },
  });
  if (clockedOut.count === 0) {
    return { ok: false, error: "You are not clocked in for this walk." };
  }

  revalidatePath(`/w/${walk.token}`);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/walks/${walk.id}`);
  return { ok: true, message: "You have clocked out. Your name is no longer on the walk for other members." };
}

// ---------------------------------------------------------------- delete member

function isNotFoundStatus(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: unknown }).status === 404
  );
}

export async function deleteMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  if (id === admin.id) {
    return { ok: false, error: "You cannot delete your own account from here." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { walksCreated: true, attendances: true } } },
  });
  if (!target) return { ok: false, error: "That member is no longer in the group." };

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { ok: false, error: "You cannot delete the last organiser." };
    }
  }

  const clerk = await clerkClient();
  try {
    await clerk.users.deleteUser(target.clerkId);
  } catch (err) {
    if (!isNotFoundStatus(err)) {
      return { ok: false, error: "Could not remove their login. Try again in a moment." };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (target._count.walksCreated > 0) {
      await tx.walk.updateMany({
        where: { createdById: target.id },
        data: { createdById: admin.id },
      });
    }
    await tx.user.delete({ where: { id: target.id } });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");
  return { ok: true, message: `${displayName(target)} has been removed from the group.` };
}

// ----------------------------------------------------------- homepage slides

const MAX_SLIDE_BYTES = 4 * 1024 * 1024;

async function readSlideImage(
  formData: FormData,
): Promise<{ data: Uint8Array<ArrayBuffer>; mime: string } | { error: string }> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > MAX_SLIDE_BYTES) {
    return { error: "Keep the image under 4 MB." };
  }
  const data = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  const mime = sniffImageMime(data);
  if (!mime || !isAllowedImageMime(mime)) {
    return { error: "Use a JPEG, PNG or WebP image." };
  }
  return { data, mime };
}

function revalidateHomepage() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/hero-photos");
  revalidatePath("/admin/settings/testimonials");
  revalidatePath("/admin/settings/faqs");
}

async function applySortOrder(
  ids: string[],
  existing: { id: string }[],
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const allowed = new Set(existing.map((row) => row.id));
  const next = ids.filter((id) => allowed.has(id));
  for (const row of existing) {
    if (!next.includes(row.id)) next.push(row.id);
  }
  if (next.length === 0) return;
  await prisma.$transaction(next.map((id, index) => update(id, index)));
}

export async function addHomepageSlide(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const count = await prisma.homepageSlide.count();
  if (count >= MAX_HOMEPAGE_SLIDES) {
    return { ok: false, error: "You can have up to 3 slides." };
  }

  const image = await readSlideImage(formData);
  if ("error" in image) return { ok: false, error: image.error };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || "Bury Steps Walking Group";

  await prisma.homepageSlide.create({
    data: {
      sortOrder: count,
      alt,
      imagePath: null,
      imageMime: image.mime,
      imageData: image.data,
    },
  });

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
  } catch {
    return { ok: false, error: "That slide is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Slide saved." };
}

export async function moveHomepageSlide(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("slideId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Could not move that slide." };
  }

  // Only the id/sortOrder pair is needed to compute the swap — selecting
  // whole rows here would also pull every slide's image bytes (up to 4 MB
  // each) just to reorder them.
  const slides = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const index = slides.findIndex((slide) => slide.id === id);
  if (index < 0) return { ok: false, error: "That slide is no longer there." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= slides.length) {
    return { ok: false, error: "Already at the end." };
  }

  const a = slides[index]!;
  const b = slides[swapWith]!;

  await prisma.$transaction([
    prisma.homepageSlide.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.homepageSlide.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  revalidateHomepage();
  return { ok: true, message: "Slide order updated." };
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
  } catch {
    return { ok: false, error: "That slide is no longer there." };
  }

  const remaining = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    remaining.map((slide, index) =>
      prisma.homepageSlide.update({ where: { id: slide.id }, data: { sortOrder: index } }),
    ),
  );

  revalidateHomepage();
  return { ok: true, message: "Slide removed." };
}

// ----------------------------------------------------------- homepage testimonials

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

async function readOptionalImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return readSlideImage(formData);
}

export async function addHomepageTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const count = await prisma.homepageTestimonial.count();
  if (count >= MAX_HOMEPAGE_TESTIMONIALS) {
    return { ok: false, error: "You can have up to 12 testimonials." };
  }

  const copy = readTestimonialCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };

  await prisma.homepageTestimonial.create({
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
  } catch {
    return { ok: false, error: "That testimonial is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Testimonial saved." };
}

export async function moveHomepageTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("testimonialId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Could not move that testimonial." };
  }

  // Only the id/sortOrder pair is needed to compute the swap — selecting
  // whole rows here would also pull every testimonial's photo bytes (up to
  // 4 MB each) just to reorder them.
  const rows = await prisma.homepageTestimonial.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: "That testimonial is no longer there." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) {
    return { ok: false, error: "Already at the end." };
  }

  const a = rows[index]!;
  const b = rows[swapWith]!;

  await prisma.$transaction([
    prisma.homepageTestimonial.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.homepageTestimonial.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  revalidateHomepage();
  return { ok: true, message: "Testimonial order updated." };
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
  } catch {
    return { ok: false, error: "That testimonial is no longer there." };
  }

  const remaining = await prisma.homepageTestimonial.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    remaining.map((row, index) =>
      prisma.homepageTestimonial.update({ where: { id: row.id }, data: { sortOrder: index } }),
    ),
  );

  revalidateHomepage();
  return { ok: true, message: "Testimonial removed." };
}

// ------------------------------------------------------------------ homepage FAQs

async function readFaqCopy(
  formData: FormData,
): Promise<{ categoryId: string; question: string; answer: string } | { error: string }> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!categoryId) return { error: "Choose a category." };
  const category = await prisma.homepageFaqCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) return { error: "Choose a category." };
  if (!question) return { error: "Add a question." };
  if (!answer) return { error: "Add an answer." };
  if (question.length > 160) return { error: "Keep the question under 160 characters." };
  if (answer.length > 1200) return { error: "Keep the answer under 1,200 characters." };
  return { categoryId, question, answer };
}

function readCategoryLabel(formData: FormData): { label: string } | { error: string } {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Add a category name." };
  if (label.length > MAX_FAQ_CATEGORY_LABEL) {
    return { error: `Keep the name under ${MAX_FAQ_CATEGORY_LABEL} characters.` };
  }
  return { label };
}

async function uniqueFaqCategorySlug(label: string): Promise<string> {
  const base = faqCategorySlug(label);
  let slug = base;
  let n = 2;
  while (
    await prisma.homepageFaqCategory.findFirst({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function addHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const count = await prisma.homepageFaq.count();
  if (count >= MAX_HOMEPAGE_FAQS) {
    return { ok: false, error: "You can have up to 20 FAQs." };
  }

  const copy = await readFaqCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  await prisma.homepageFaq.create({
    data: {
      sortOrder: count,
      categoryId: copy.categoryId,
      question: copy.question,
      answer: copy.answer,
    },
  });

  revalidateHomepage();
  return { ok: true, message: "FAQ added." };
}

export async function updateHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("faqId") ?? "");
  if (!id) return { ok: false, error: "No FAQ selected." };

  const copy = await readFaqCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.homepageFaq.update({
      where: { id },
      data: {
        categoryId: copy.categoryId,
        question: copy.question,
        answer: copy.answer,
      },
    });
  } catch {
    return { ok: false, error: "That FAQ is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ saved." };
}

export async function moveHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("faqId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Could not move that FAQ." };
  }

  const rows = await prisma.homepageFaq.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: "That FAQ is no longer there." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) {
    return { ok: false, error: "Already at the end." };
  }

  const a = rows[index]!;
  const b = rows[swapWith]!;

  await prisma.$transaction([
    prisma.homepageFaq.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.homepageFaq.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  revalidateHomepage();
  return { ok: true, message: "FAQ order updated." };
}

export async function deleteHomepageFaq(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("faqId") ?? "");
  if (!id) return { ok: false, error: "No FAQ selected." };

  try {
    await prisma.homepageFaq.delete({ where: { id } });
  } catch {
    return { ok: false, error: "That FAQ is no longer there." };
  }

  const remaining = await prisma.homepageFaq.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    remaining.map((row, index) =>
      prisma.homepageFaq.update({ where: { id: row.id }, data: { sortOrder: index } }),
    ),
  );

  revalidateHomepage();
  return { ok: true, message: "FAQ removed." };
}

// ------------------------------------------------------------------ site notices

function revalidateNotices() {
  revalidateTag(NOTICES_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/notices");
}

function readNoticeCopy(formData: FormData): { title: string; body: string } | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return { error: "Add a title." };
  if (!body) return { error: "Add a message." };
  if (title.length > 80) return { error: "Keep the title under 80 characters." };
  if (body.length > 500) return { error: "Keep the message under 500 characters." };
  return { title, body };
}

export async function addSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const count = await prisma.siteNotice.count();
  if (count >= MAX_SITE_NOTICES) {
    return { ok: false, error: "You can have up to 10 notices." };
  }

  const copy = readNoticeCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  await prisma.siteNotice.create({
    data: { title: copy.title, body: copy.body },
  });

  revalidateNotices();
  return { ok: true, message: "Notice added. Members will see it in the bell." };
}

export async function updateSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("noticeId") ?? "");
  if (!id) return { ok: false, error: "No notice selected." };

  const copy = readNoticeCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.$transaction([
      prisma.siteNotice.update({
        where: { id },
        data: { title: copy.title, body: copy.body },
      }),
      prisma.siteNoticeRead.deleteMany({ where: { noticeId: id } }),
    ]);
  } catch {
    return { ok: false, error: "That notice is no longer there." };
  }

  revalidateNotices();
  return { ok: true, message: "Notice updated. Members will see it as new." };
}

export async function deleteSiteNotice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("noticeId") ?? "");
  if (!id) return { ok: false, error: "No notice selected." };

  try {
    await prisma.siteNotice.delete({ where: { id } });
  } catch {
    return { ok: false, error: "That notice is no longer there." };
  }

  revalidateNotices();
  return { ok: true, message: "Notice removed." };
}

export async function markSiteNoticesRead(): Promise<ActionResult> {
  const user = await requireUser();

  const notices = await prisma.siteNotice.findMany({ select: { id: true } });
  if (notices.length === 0) return { ok: true };

  await prisma.siteNoticeRead.createMany({
    data: notices.map((notice) => ({ noticeId: notice.id, userId: user.id })),
    skipDuplicates: true,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSiteTheme(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const hex = normalizeHex(String(formData.get("primaryColor") ?? ""));
  if (!hex) return { ok: false, error: "Pick a colour, or type a hex code such as #1f3d2b." };

  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, primaryColor: hex },
    update: { primaryColor: hex },
  });

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/appearance");
  return { ok: true, message: "Site colour saved." };
}

export async function updateCarouselEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const enabled = String(formData.get("carouselEnabled") ?? "") === "on";

  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: {
      id: SITE_SETTING_ID,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      carouselEnabled: enabled,
    },
    update: { carouselEnabled: enabled },
  });

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/hero-photos");
  return { ok: true, message: enabled ? "You have turned the carousel on." : "You have turned the carousel off." };
}

export async function updateScrollToTopEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const enabled = String(formData.get("scrollToTopEnabled") ?? "") === "on";

  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: {
      id: SITE_SETTING_ID,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      carouselEnabled: true,
      scrollToTopEnabled: enabled,
    },
    update: { scrollToTopEnabled: enabled },
  });

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: enabled ? "Back to top is on." : "Back to top is off." };
}

export async function reorderHomepageSlides(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.homepageSlide.findMany({ select: { id: true } });
  await applySortOrder(ids, existing, (id, sortOrder) =>
    prisma.homepageSlide.update({ where: { id }, data: { sortOrder } }),
  );
  revalidateHomepage();
  return { ok: true };
}

export async function reorderHomepageTestimonials(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.homepageTestimonial.findMany({ select: { id: true } });
  await applySortOrder(ids, existing, (id, sortOrder) =>
    prisma.homepageTestimonial.update({ where: { id }, data: { sortOrder } }),
  );
  revalidateHomepage();
  return { ok: true };
}

export async function reorderHomepageFaqs(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.homepageFaq.findMany({ select: { id: true } });
  await applySortOrder(ids, existing, (id, sortOrder) =>
    prisma.homepageFaq.update({ where: { id }, data: { sortOrder } }),
  );
  revalidateHomepage();
  return { ok: true };
}

export async function addHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const count = await prisma.homepageFaqCategory.count();
  if (count >= MAX_FAQ_CATEGORIES) {
    return { ok: false, error: `You can have up to ${MAX_FAQ_CATEGORIES} categories.` };
  }

  const copy = readCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  await prisma.homepageFaqCategory.create({
    data: {
      label: copy.label,
      slug: await uniqueFaqCategorySlug(copy.label),
      sortOrder: count,
    },
  });

  revalidateHomepage();
  return { ok: true, message: "Category added." };
}

export async function updateHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };

  const copy = readCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await prisma.homepageFaqCategory.update({
      where: { id },
      data: { label: copy.label },
    });
  } catch {
    return { ok: false, error: "That category is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "Category saved." };
}

export async function deleteHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("categoryId") ?? "");
  if (!id) return { ok: false, error: "No category selected." };

  const category = await prisma.homepageFaqCategory.findUnique({
    where: { id },
    select: { id: true, _count: { select: { faqs: true } } },
  });
  if (!category) return { ok: false, error: "That category is no longer there." };

  const remaining = await prisma.homepageFaqCategory.count();
  if (remaining <= 1) {
    return { ok: false, error: "Keep at least one category." };
  }
  if (category._count.faqs > 0) {
    return { ok: false, error: "Move or remove the FAQs in this category first." };
  }

  await prisma.homepageFaqCategory.delete({ where: { id } });

  const leftover = await prisma.homepageFaqCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction(
    leftover.map((row, index) =>
      prisma.homepageFaqCategory.update({ where: { id: row.id }, data: { sortOrder: index } }),
    ),
  );

  revalidateHomepage();
  return { ok: true, message: "Category removed." };
}

export async function reorderHomepageFaqCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.homepageFaqCategory.findMany({ select: { id: true } });
  await applySortOrder(ids, existing, (id, sortOrder) =>
    prisma.homepageFaqCategory.update({ where: { id }, data: { sortOrder } }),
  );
  revalidateHomepage();
  return { ok: true };
}

export type MemberHistoryItem = {
  id: string;
  walkId: string;
  walkTitle: string;
  location: string | null;
  durationMins: number;
  startsAt: string;
  cancelledAt: string | null;
  clockedInAt: string;
  clockedOutAt: string | null;
  clockedOutReason: string | null;
};

export async function getMemberHistory(userId: string): Promise<{
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  walkCount: number;
  isYou: boolean;
  items: MemberHistoryItem[];
} | null> {
  const admin = await requireAdmin();
  const member = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { walksCreated: true } },
      attendances: {
        orderBy: { clockedInAt: "desc" },
        include: {
          walk: {
            select: {
              id: true,
              title: true,
              location: true,
              durationMins: true,
              startsAt: true,
              cancelledAt: true,
            },
          },
        },
      },
    },
  });
  if (!member) return null;

  return {
    name: displayName(member),
    email: member.email,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
    walkCount: member._count.walksCreated,
    isYou: member.id === admin.id,
    items: member.attendances.map((attendance) => ({
      id: attendance.id,
      walkId: attendance.walk.id,
      walkTitle: attendance.walk.title,
      location: attendance.walk.location,
      durationMins: attendance.walk.durationMins,
      startsAt: attendance.walk.startsAt.toISOString(),
      cancelledAt: attendance.walk.cancelledAt?.toISOString() ?? null,
      clockedInAt: attendance.clockedInAt.toISOString(),
      clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
      clockedOutReason: attendance.clockedOutReason,
    })),
  };
}

const reportCopySchema = z.object({
  happenedAt: z.string().min(16, "Choose a date and time."),
  walkId: z.string().optional(),
  whatHappened: z.string().trim().min(3, "Say what happened.").max(4000),
  whoInvolved: z.string().trim().min(2, "Say who was involved.").max(1000),
  whatWeDid: z.string().trim().min(3, "Say what you did.").max(4000),
  organiserNotes: z.string().trim().max(4000).optional(),
});

function readReportCopy(formData: FormData) {
  return reportCopySchema.safeParse({
    happenedAt: formData.get("happenedAt"),
    walkId: (() => {
      const value = String(formData.get("walkId") ?? "").trim();
      return !value || value === "none" ? undefined : value;
    })(),
    whatHappened: formData.get("whatHappened"),
    whoInvolved: formData.get("whoInvolved"),
    whatWeDid: formData.get("whatWeDid"),
    organiserNotes: String(formData.get("organiserNotes") ?? "").trim() || undefined,
  });
}

export async function addAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = readReportCopy(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let happenedAt: Date;
  try {
    happenedAt = londonWallClockToUtc(parsed.data.happenedAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  await prisma.accidentReport.create({
    data: {
      happenedAt,
      walkId: parsed.data.walkId ?? null,
      whatHappened: parsed.data.whatHappened,
      whoInvolved: parsed.data.whoInvolved,
      whatWeDid: parsed.data.whatWeDid,
      organiserNotes: parsed.data.organiserNotes ?? null,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report saved." };
}

export async function updateAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("reportId") ?? "");
  if (!id) return { ok: false, error: "No report selected." };

  const parsed = readReportCopy(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let happenedAt: Date;
  try {
    happenedAt = londonWallClockToUtc(parsed.data.happenedAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  try {
    await prisma.accidentReport.update({
      where: { id },
      data: {
        happenedAt,
        walkId: parsed.data.walkId ?? null,
        whatHappened: parsed.data.whatHappened,
        whoInvolved: parsed.data.whoInvolved,
        whatWeDid: parsed.data.whatWeDid,
        organiserNotes: parsed.data.organiserNotes ?? null,
      },
    });
  } catch {
    return { ok: false, error: "That report is no longer there." };
  }

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report saved." };
}

export async function deleteAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("reportId") ?? "");
  if (!id) return { ok: false, error: "No report selected." };

  try {
    await prisma.accidentReport.delete({ where: { id } });
  } catch {
    return { ok: false, error: "That report is no longer there." };
  }

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report removed." };
}

export async function clearSiteCache(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: "Site cache cleared. The public homepage will refresh on the next visit.",
  };
}
