"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { londonWallClockToUtc } from "@/lib/dates";
import {
  geocodeFields,
  normalizeUkPostcode,
  parseFormPoint,
  searchPlaces,
  type PlaceHit,
} from "@/lib/geocode";
import { isWalkScheduleLocked, isWalkStartInThePast, walkStatus } from "@/lib/walk-window";
import { checkRateLimit } from "@/lib/rate-limit";
import { allocateWalkSlug } from "@/lib/walk-slug";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  isPrismaCode,
  logActionError,
  revalidateWalkShare,
  withCountLimitLock,
} from "./shared";

/** Stable unguessable id for clock-in forms. Old /w/<token> links still work. */
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 12);

const walkDetailsSchema = z.object({
  title: z.string().trim().min(3, "Give the walk a title of at least 3 characters.").max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  postcode: z.string().trim().max(10).optional(),
  startsAt: z.string().min(16, "Choose a date and time."),
  durationMins: z.coerce.number().int().min(15).max(600),
});

async function walkPinFromForm(
  formData: FormData,
  location: string | null | undefined,
  postcode: string | null | undefined,
): Promise<{ latitude: number | null; longitude: number | null; postcode: string | null }> {
  const storedPostcode = normalizeUkPostcode(postcode) ?? (postcode?.trim() ? postcode.trim().toUpperCase() : null);
  const picked = parseFormPoint(formData.get("latitude"), formData.get("longitude"));
  if (picked) {
    return { latitude: picked.lat, longitude: picked.lng, postcode: storedPostcode };
  }
  const coords = await geocodeFields(location ?? null, postcode);
  return { ...coords, postcode: storedPostcode };
}

export async function createWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = walkDetailsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    postcode: formData.get("postcode") || undefined,
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
  if (isWalkStartInThePast(startsAt)) {
    return { ok: false, error: "Choose a start time that has not passed yet." };
  }

  const pin = await walkPinFromForm(formData, parsed.data.location, parsed.data.postcode);

  let walk: { title: string; token: string; slug: string | null } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = await allocateWalkSlug(parsed.data.title);
    try {
      walk = await prisma.walk.create({
        data: {
          token: makeToken(),
          slug,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          location: parsed.data.location ?? null,
          postcode: pin.postcode,
          latitude: pin.latitude,
          longitude: pin.longitude,
          startsAt,
          durationMins: parsed.data.durationMins,
          createdById: admin.id,
        },
        select: { title: true, token: true, slug: true },
      });
      break;
    } catch (err) {
      if (isPrismaCode(err, "P2002") && attempt < 4) continue;
      return logActionError("createWalk", err, "Could not create the walk. Try again.");
    }
  }
  if (!walk) {
    return { ok: false, error: "Could not create the walk. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidateWalkShare(walk);
  return { ok: true, message: `“${walk.title}” created. Share link is ready.` };
}

/** Copy a walk’s details onto a new walk one week later (same weekday/time). */
export async function duplicateWalk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const source = await prisma.walk.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      location: true,
      postcode: true,
      latitude: true,
      longitude: true,
      startsAt: true,
      durationMins: true,
    },
  });
  if (!source) return { ok: false, error: "That walk is no longer there." };

  let startsAt = new Date(source.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Keep bumping a week until the copy is still in the future (old History walks).
  while (isWalkStartInThePast(startsAt)) {
    startsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  let walk: { id: string; title: string; token: string; slug: string | null } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = await allocateWalkSlug(source.title);
    try {
      walk = await prisma.walk.create({
        data: {
          token: makeToken(),
          slug,
          title: source.title,
          description: source.description,
          location: source.location,
          postcode: source.postcode,
          latitude: source.latitude,
          longitude: source.longitude,
          startsAt,
          durationMins: source.durationMins,
          createdById: admin.id,
        },
        select: { id: true, title: true, token: true, slug: true },
      });
      break;
    } catch (err) {
      if (isPrismaCode(err, "P2002") && attempt < 4) continue;
      return logActionError("duplicateWalk", err, "Could not duplicate this walk. Try again.");
    }
  }
  if (!walk) {
    return { ok: false, error: "Could not duplicate this walk. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath(`/admin/walks/${walk.id}`);
  revalidateWalkShare(walk);
  return {
    ok: true,
    message: `“${walk.title}” duplicated for next week. Check the date before you share it.`,
    href: `/admin/walks/${walk.id}`,
  };
}

export async function searchWalkPlaces(
  location: string,
  postcode: string,
): Promise<{ ok: true; places: PlaceHit[] } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const limited = checkRateLimit(`${admin.id}:searchWalkPlaces`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many searches. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const loc = location.trim();
  const pc = postcode.trim();
  if (!loc && !pc) return { ok: false, error: "Type a meeting point or a postcode first." };
  if (loc.length > 200) return { ok: false, error: "Keep the meeting point under 200 characters." };
  if (pc.length > 10) return { ok: false, error: "That postcode is too long." };

  const places = await searchPlaces(loc, pc);
  if (places.length === 0) {
    return { ok: false, error: "Nothing found. Try a postcode or a fuller name." };
  }
  return { ok: true, places };
}

export async function cancelWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length > 500) {
    return { ok: false, error: "Keep the reason under 500 characters." };
  }

  // Same journeyEvent lock as create/update/delete journey so cancel cannot
  // race with a journey write that already passed its cancelledAt check.
  let walk: { token: string; slug: string | null };
  try {
    walk = await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const current = await tx.walk.findUnique({
        where: { id },
        select: {
          id: true,
          token: true,
          slug: true,
          cancelledAt: true,
          startsAt: true,
          durationMins: true,
        },
      });
      if (!current) throw new Error("WALK_GONE");
      if (current.cancelledAt) {
        throw new LimitReachedError("This walk is already cancelled.");
      }
      if (walkStatus(current) === "completed") {
        throw new LimitReachedError("This walk has already finished, so it can't be cancelled.");
      }

      try {
        await tx.walk.update({
          where: { id },
          data: {
            cancelledAt: new Date(),
            cancelledReason: reason || null,
          },
        });
      } catch (err) {
        logActionError("cancelWalk:withReason", err);
        await tx.walk.update({
          where: { id },
          data: { cancelledAt: new Date() },
        });
      }

      return { token: current.token, slug: current.slug };
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "WALK_GONE") {
      return { ok: false, error: "That walk is no longer there." };
    }
    return logActionError("cancelWalk", err, "Could not cancel this walk. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidateWalkShare(walk);
  return { ok: true, message: "Walk cancelled. Members will see it marked as cancelled." };
}

export async function reopenWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: { id: true, token: true, slug: true, cancelledAt: true },
  });
  if (!walk) return { ok: false, error: "That walk is no longer there." };
  if (!walk.cancelledAt) return { ok: false, error: "This walk is already open." };

  try {
    await prisma.walk.update({
      where: { id },
      data: { cancelledAt: null, cancelledReason: null },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return logActionError("reopenWalk", err, "Could not reopen this walk. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidateWalkShare(walk);
  return { ok: true, message: "Walk reopened. Members can clock in again if the window is still open." };
}

export async function updateWalk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const parsed = walkDetailsSchema
    .extend({
      reopen: z.string().optional(),
      // Sent by the dialog that already knows this from the page it rendered
      // from — avoids a round trip to look the walk up just to re-read a
      // value the caller already had.
      wasCancelled: z.string().optional(),
    })
    .safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      location: formData.get("location") || undefined,
      postcode: formData.get("postcode") || undefined,
      startsAt: formData.get("startsAt"),
      durationMins: formData.get("durationMins") ?? 90,
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
  let durationMins = parsed.data.durationMins;

  const wasCancelled = parsed.data.wasCancelled === "on";

  // A completed walk already happened — editing it would silently rewrite
  // history instead of changing a plan, so it's blocked the same way
  // cancelling one is. A cancelled walk is never "completed" (it's its own
  // status regardless of timing), so reopening a cancelled walk via Edit is
  // unaffected by this check.
  const existing = await prisma.walk.findUnique({
    where: { id },
    select: { cancelledAt: true, startsAt: true, durationMins: true, token: true, slug: true },
  });
  if (!existing) return { ok: false, error: "That walk is no longer there." };
  if (walkStatus(existing) === "completed") {
    return { ok: false, error: "This walk has already finished, so it can't be edited." };
  }

  // After the published start, keep the stored date, time, and length even
  // if the form still posts those fields (disabled controls) or someone
  // tampers with them. Title, meeting point, and notes can still change.
  if (isWalkScheduleLocked(existing.startsAt)) {
    startsAt = existing.startsAt;
    durationMins = existing.durationMins;
  } else if (isWalkStartInThePast(startsAt)) {
    return { ok: false, error: "Choose a start time that has not passed yet." };
  }

  const pin = await walkPinFromForm(formData, parsed.data.location, parsed.data.postcode);

  let walk: { token: string; slug: string | null } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = await allocateWalkSlug(parsed.data.title, id);
    try {
      walk = await prisma.walk.update({
        where: { id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          startsAt,
          durationMins,
          location: parsed.data.location ?? null,
          postcode: pin.postcode,
          latitude: pin.latitude,
          longitude: pin.longitude,
          slug,
          ...(parsed.data.reopen === "on" || wasCancelled
            ? { cancelledAt: null, cancelledReason: null }
            : {}),
        },
        select: { token: true, slug: true },
      });
      break;
    } catch (err) {
      if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
      if (isPrismaCode(err, "P2002") && attempt < 4) continue;
      return logActionError("updateWalk", err, "Could not update this walk. Try again.");
    }
  }
  if (!walk) {
    return { ok: false, error: "Could not update this walk. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  revalidateWalkShare(existing);
  revalidateWalkShare(walk);
  return {
    ok: true,
    message: wasCancelled ? "Walk updated and put back on the diary." : "Walk updated.",
  };
}

export async function deleteWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  let walk: { token: string; slug: string | null; title: string };
  try {
    walk = await prisma.walk.delete({
      where: { id },
      select: { token: true, slug: true, title: true },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return logActionError("deleteWalk", err, "Could not remove this walk. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidateWalkShare(walk);
  return {
    ok: true,
    message: `“${walk.title}” has been removed.`,
    href: "/admin",
  };
}
