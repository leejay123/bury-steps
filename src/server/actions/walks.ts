"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatWalkDate, formatWalkLength, londonWallClockToUtc, addLondonCalendarDays } from "@/lib/dates";
import {
  geocodeFields,
  meetingPointLabel,
  normalizeUkPostcode,
  parseFormPoint,
  searchPlaces,
  type PlaceHit,
} from "@/lib/geocode";
import { normalizeWhat3Words } from "@/lib/what3words";
import {
  END_WALK_MINUTES_AGO_OPTIONS,
  isWalkScheduleLocked,
  isWalkStartInThePast,
  walkStatus,
} from "@/lib/walk-window";
import { conditionsPurgeAfterFromStartsAt } from "@/lib/conditions-retention";
import { checkRateLimit } from "@/lib/rate-limit";
import { walkShareUrl, walkSlugBase, walkSlugNameBase } from "@/lib/walk-slug";
import { allocateWalkSlug } from "@/lib/walk-slug-server";
import { appUrl } from "@/lib/urls";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  buildWalkAnnouncedEmail,
  buildWalkCancelledEmail,
  buildWalkReopenedEmail,
  type MemberLike,
  type WalkLike,
} from "@/lib/email/mailer";
import { sendEmailBatch } from "@/lib/email/client";
import {
  type ActionResult,
  LimitReachedError,
  isPrismaCode,
  logActionError,
  ownerDenied,
  permissionDenied,
  revalidateWalkShare,
  withCountLimitLock,
} from "./shared";
import { isOwner, actorStillOwner } from "@/lib/site-owner";

/** Stable unguessable id for clock-in forms. Old /w/<token> links still work. */
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 12);

const walkDetailsSchema = z.object({
  title: z.string().trim().min(3, "Give the walk a title of at least 3 characters.").max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  postcode: z.string().trim().max(10).optional(),
  what3words: z.string().trim().max(120).optional(),
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

async function membersOptedIntoWalkAnnouncements(): Promise<MemberLike[]> {
  return prisma.user.findMany({
    where: { emailWalkAnnouncements: true },
    select: { id: true, email: true, firstName: true, unsubscribeToken: true },
  });
}

/** Best-effort fan-out to every opted-in member via Resend's batch send
 * (see sendEmailBatch) — never a single email with everyone in `to:` (that
 * would leak every member's address to every other member); each member
 * still gets their own separate, individually addressed email. Building
 * each member's email (a couple of DB/config reads, no network call to
 * Resend) stays a plain Promise.all — only the actual send needs chunking. */
async function notifyMembersOfNewWalk(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
): Promise<void> {
  try {
    const members = await membersOptedIntoWalkAnnouncements();
    const emails = await Promise.all(members.map((member) => buildWalkAnnouncedEmail(walk, member)));
    await sendEmailBatch(emails);
  } catch (err) {
    console.error("notifyMembersOfNewWalk: failed to notify recipients", err);
  }
}

async function notifyMembersOfCancelledWalk(walk: WalkLike & { reason: string | null }): Promise<void> {
  try {
    const members = await membersOptedIntoWalkAnnouncements();
    const emails = await Promise.all(members.map((member) => buildWalkCancelledEmail(walk, member)));
    await sendEmailBatch(emails);
  } catch (err) {
    console.error("notifyMembersOfCancelledWalk: failed to notify recipients", err);
  }
}

async function notifyMembersOfWalkReopened(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
): Promise<void> {
  try {
    const members = await membersOptedIntoWalkAnnouncements();
    const emails = await Promise.all(members.map((member) => buildWalkReopenedEmail(walk, member)));
    await sendEmailBatch(emails);
  } catch (err) {
    console.error("notifyMembersOfWalkReopened: failed to notify recipients", err);
  }
}

/** Blank clears it; anything else must actually look like an address. */
function parseWhat3Words(
  raw: string | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!raw?.trim()) return { ok: true, value: null };
  const normalized = normalizeWhat3Words(raw);
  if (!normalized) {
    return {
      ok: false,
      error: "That doesn't look like a what3words address — three words separated by dots, e.g. filled.count.soap.",
    };
  }
  return { ok: true, value: normalized };
}

export async function createWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksCreate) return permissionDenied("permWalksCreate");

  const parsed = walkDetailsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    postcode: formData.get("postcode") || undefined,
    what3words: formData.get("what3words") || undefined,
    startsAt: formData.get("startsAt"),
    durationMins: formData.get("durationMins") ?? 90,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const what3words = parseWhat3Words(parsed.data.what3words);
  if (!what3words.ok) return { ok: false, error: what3words.error };

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
          what3words: what3words.value,
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
  revalidatePath("/walks");
  revalidateWalkShare(walk);

  await notifyMembersOfNewWalk({
    title: walk.title,
    whenText: formatWalkDate(startsAt),
    durationText: formatWalkLength(parsed.data.durationMins),
    meetingPoint: meetingPointLabel(parsed.data.location, pin.postcode) || null,
    what3words: what3words.value,
    shareUrl: walkShareUrl(appUrl(), walk),
  });

  return { ok: true, message: `“${walk.title}” created. Share link is ready.` };
}

/** Copy a walk’s details onto a new walk one week later (same weekday/time). */
export async function duplicateWalk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksCreate) return permissionDenied("permWalksCreate");
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
      what3words: true,
      startsAt: true,
      durationMins: true,
    },
  });
  if (!source) return { ok: false, error: "That walk is no longer there." };

  let startsAt = addLondonCalendarDays(source.startsAt, 7);
  // Keep bumping a week until the copy is still in the future (old History walks).
  while (isWalkStartInThePast(startsAt)) {
    startsAt = addLondonCalendarDays(startsAt, 7);
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
          what3words: source.what3words,
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
  revalidatePath("/walks");
  revalidatePath(`/admin/walks/${walk.id}`);
  revalidateWalkShare(walk);
  return {
    ok: true,
    message: `“${walk.title}” duplicated for ${formatWalkDate(startsAt)}. Check the date before you share it.`,
    href: `/admin/walks/${walk.id}`,
  };
}

export async function searchWalkPlaces(
  location: string,
  postcode: string,
): Promise<{ ok: true; places: PlaceHit[] } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  // Used by both the create and edit forms' address autocomplete — either
  // capability that would actually reach this is enough.
  if (!admin.permWalksCreate && !admin.permWalksEdit) return permissionDenied("permWalksCreate");
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
  const admin = await requireAdmin();
  if (!admin.permWalksCancel) return permissionDenied("permWalksCancel");
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length > 500) {
    return { ok: false, error: "Keep the reason under 500 characters." };
  }

  // Same journeyEvent lock as create/update/delete journey so cancel cannot
  // race with a journey write that already passed its cancelledAt check.
  let walk: { token: string; slug: string | null; title: string; startsAt: Date };
  try {
    walk = await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          token: string;
          slug: string | null;
          title: string;
          cancelledAt: Date | null;
          startsAt: Date;
          durationMins: number;
          endedAt: Date | null;
        }>
      >`SELECT id, token, slug, title, "cancelledAt", "startsAt", "durationMins", "endedAt"
        FROM "Walk" WHERE id = ${id} FOR UPDATE`;
      const current = rows[0];
      if (!current) throw new Error("WALK_GONE");
      if (current.cancelledAt) {
        throw new LimitReachedError("This walk is already cancelled.");
      }
      // Cancelled means it never happened — no longer true once people are
      // actually out on it. End it early instead once it's under way.
      const status = walkStatus(current);
      if (status === "completed") {
        throw new LimitReachedError("This walk has already finished, so it can't be cancelled.");
      }
      if (status === "in-progress") {
        throw new LimitReachedError(
          "This walk has already started, so it can't be cancelled. End it early instead if it needs to stop.",
        );
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

      return { token: current.token, slug: current.slug, title: current.title, startsAt: current.startsAt };
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
  revalidatePath("/walks");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidateWalkShare(walk);

  await notifyMembersOfCancelledWalk({
    title: walk.title,
    whenText: formatWalkDate(walk.startsAt),
    reason: reason || null,
    shareUrl: walkShareUrl(appUrl(), walk),
  });

  return { ok: true, message: "Walk cancelled. Members will see it marked as cancelled." };
}

export async function reopenWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksCancel) return permissionDenied("permWalksCancel");
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      slug: true,
      cancelledAt: true,
      title: true,
      location: true,
      postcode: true,
      what3words: true,
      startsAt: true,
      durationMins: true,
      endedAt: true,
    },
  });
  if (!walk) return { ok: false, error: "That walk is no longer there." };
  if (!walk.cancelledAt) return { ok: false, error: "This walk is already open." };

  let clearedAttendances = false;
  try {
    // Lock + updateMany keyed on cancelledAt still set — a double-click must
    // not clear an already-open walk or fan out "back on" email twice.
    const outcome = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          cancelledAt: Date | null;
          startsAt: Date;
          durationMins: number;
          endedAt: Date | null;
        }>
      >`SELECT id, "cancelledAt", "startsAt", "durationMins", "endedAt"
        FROM "Walk" WHERE id = ${id} FOR UPDATE`;
      const locked = rows[0];
      if (!locked) throw new Error("WALK_GONE");
      if (!locked.cancelledAt) {
        return { cleared: false as const, dropAttendances: false as const };
      }

      const cleared = await tx.walk.updateMany({
        where: { id, cancelledAt: { not: null } },
        // Clear retentionLocked too — the flag only applies while cancelled,
        // and leaving it true would silently block later auto-delete after a
        // future cancel (the UI toggle is hidden once the walk is open).
        data: { cancelledAt: null, cancelledReason: null, retentionLocked: false },
      });
      if (cleared.count === 0) {
        return { cleared: false as const, dropAttendances: false as const };
      }

      // Cancelled means it never happened. Reopening after the window has
      // already closed would otherwise turn kept Starting-soon clock-ins into
      // Progress credit for a meet that did not run — drop those rows.
      const status = walkStatus({ ...locked, cancelledAt: null });
      if (status === "completed") {
        await tx.attendance.deleteMany({ where: { walkId: id } });
        return { cleared: true as const, dropAttendances: true as const };
      }
      return { cleared: true as const, dropAttendances: false as const };
    });

    if (!outcome.cleared) {
      return { ok: false, error: "This walk is already open." };
    }
    clearedAttendances = outcome.dropAttendances;
  } catch (err) {
    if (err instanceof Error && err.message === "WALK_GONE") {
      return { ok: false, error: "That walk is no longer there." };
    }
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return logActionError("reopenWalk", err, "Could not reopen this walk. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/walks");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidateWalkShare(walk);

  // Reopening a walk that has already started (or finished) just restores
  // the record — telling every member it's "back on" would be wrong once
  // the meet time has passed. Still email for upcoming and starting-soon
  // (clock-in window open, meet not yet).
  const status = walkStatus({ ...walk, cancelledAt: null });
  const notifyReopened = status === "upcoming" || status === "starting-soon";
  if (notifyReopened) {
    await notifyMembersOfWalkReopened({
      title: walk.title,
      whenText: formatWalkDate(walk.startsAt),
      durationText: formatWalkLength(walk.durationMins),
      meetingPoint: meetingPointLabel(walk.location, walk.postcode) || null,
      what3words: walk.what3words,
      shareUrl: walkShareUrl(appUrl(), walk),
    });
  }

  return {
    ok: true,
    message:
      status === "completed"
        ? clearedAttendances
          ? "Walk reopened in the record. Its time has already passed, so clock-in stays closed and any clock-ins from before it was cancelled were cleared (they do not count on Progress)."
          : "Walk reopened in the record. Its time has already passed, so clock-in stays closed."
        : status === "in-progress"
          ? "Walk reopened. Clock-in is already open for this walk — no email was sent."
          : "Walk reopened. Members can clock in again if the window is still open.",
  };
}

/**
 * Ends an in-progress walk before its published length is up — right now,
 * or a few minutes ago if there was no one free to tap the button the
 * moment it actually wrapped up. Clock-in closes immediately either way.
 * Attendances are left untouched: anyone still clocked in simply counts as
 * having stayed for the whole (now-shorter) walk, exactly like the
 * ordinary "walk finished and they never explicitly clocked out" case.
 */
export async function endWalkEarly(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksCancel) return permissionDenied("permWalksCancel");
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  const minutesAgoRaw = Number(formData.get("minutesAgo") ?? 0);
  const minutesAgo = (
    END_WALK_MINUTES_AGO_OPTIONS as readonly number[]
  ).includes(minutesAgoRaw)
    ? minutesAgoRaw
    : 0;

  const endedAt = new Date(Date.now() - minutesAgo * 60_000);

  let walk: { token: string; slug: string | null };
  try {
    // Same journeyEvent lock as cancel/journey writes so end cannot race a
    // create that already passed its cancelledAt / window check, and so we
    // can refuse finishing before an existing journey event time.
    walk = await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          token: string;
          slug: string | null;
          startsAt: Date;
          durationMins: number;
          endedAt: Date | null;
          cancelledAt: Date | null;
        }>
      >`SELECT id, token, slug, "startsAt", "durationMins", "endedAt", "cancelledAt"
        FROM "Walk" WHERE id = ${id} FOR UPDATE`;
      const locked = rows[0];
      if (!locked) throw new Error("WALK_GONE");
      if (locked.endedAt) {
        throw new LimitReachedError("This walk has already been ended early.");
      }
      if (walkStatus(locked) !== "in-progress") {
        throw new LimitReachedError(
          "This walk isn't in progress right now, so there's nothing to end.",
        );
      }
      if (endedAt.getTime() <= locked.startsAt.getTime()) {
        throw new LimitReachedError("That's before this walk even started.");
      }

      // Backdating past an existing clock-in/out would close the window under
      // someone already recorded as attending after that finish time.
      const latestAttendance = await tx.attendance.aggregate({
        where: { walkId: locked.id },
        _max: { clockedInAt: true, clockedOutAt: true },
      });
      const latestAttendanceMs = Math.max(
        latestAttendance._max.clockedInAt?.getTime() ?? 0,
        latestAttendance._max.clockedOutAt?.getTime() ?? 0,
      );
      if (latestAttendanceMs > 0 && endedAt.getTime() < latestAttendanceMs) {
        throw new LimitReachedError(
          "That finish time is before someone clocked in or out. Choose a later time, or end it now.",
        );
      }

      const latestJourney = await tx.walkJourneyEvent.aggregate({
        where: { walkId: locked.id },
        _max: { happenedAt: true },
      });
      const latestJourneyMs = latestJourney._max.happenedAt?.getTime() ?? 0;
      if (latestJourneyMs > 0 && endedAt.getTime() < latestJourneyMs) {
        throw new LimitReachedError(
          "That finish time is before a journey event on this walk. Choose a later time, or end it now.",
        );
      }

      const updated = await tx.walk.updateMany({
        where: { id: locked.id, endedAt: null },
        data: { endedAt },
      });
      if (updated.count === 0) {
        throw new LimitReachedError("This walk has already been ended early.");
      }

      return { token: locked.token, slug: locked.slug };
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "WALK_GONE") {
      return { ok: false, error: "That walk is no longer there." };
    }
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return logActionError("endWalkEarly", err, "Could not end this walk. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/walks");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidateWalkShare(walk);

  return {
    ok: true,
    message:
      minutesAgo === 0
        ? "Walk ended. Clock-in is now closed."
        : `Walk marked as finished ${minutesAgo} minutes ago. Clock-in is now closed.`,
  };
}

export async function updateWalk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksEdit) return permissionDenied("permWalksEdit");
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
      what3words: formData.get("what3words") || undefined,
      startsAt: formData.get("startsAt"),
      durationMins: formData.get("durationMins") ?? 90,
      reopen: formData.get("reopen") || undefined,
      wasCancelled: formData.get("wasCancelled") || undefined,
    });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const what3words = parseWhat3Words(parsed.data.what3words);
  if (!what3words.ok) return { ok: false, error: what3words.error };

  let startsAt: Date;
  try {
    startsAt = londonWallClockToUtc(parsed.data.startsAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }
  const durationMins = parsed.data.durationMins;

  const wasCancelled = parsed.data.wasCancelled === "on";
  const shouldReopen = parsed.data.reopen === "on" || wasCancelled;

  const pin = await walkPinFromForm(formData, parsed.data.location, parsed.data.postcode);

  // Lock the row for the completed/schedule checks + write so endWalkEarly
  // (or the clock rolling over) cannot slip a rewrite in between a stale
  // findUnique and update. Slug retries re-lock each attempt.
  let existing: {
    cancelledAt: Date | null;
    startsAt: Date;
    durationMins: number;
    endedAt: Date | null;
    token: string;
    slug: string | null;
  } | null = null;
  let walk: { token: string; slug: string | null } | null = null;
  let appliedStartsAt = startsAt;
  let appliedDurationMins = durationMins;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<
          Array<{
            id: string;
            cancelledAt: Date | null;
            startsAt: Date;
            durationMins: number;
            endedAt: Date | null;
            token: string;
            slug: string | null;
            title: string;
          }>
        >`SELECT id, "cancelledAt", "startsAt", "durationMins", "endedAt", token, slug, title
          FROM "Walk" WHERE id = ${id} FOR UPDATE`;
        const locked = rows[0];
        if (!locked) throw new Error("WALK_GONE");

        // A completed walk already happened — editing it would silently
        // rewrite history. A cancelled walk is never "completed" (its own
        // status regardless of timing), so reopening via Edit is fine.
        if (walkStatus(locked) === "completed") {
          throw new LimitReachedError("This walk has already finished, so it can't be edited.");
        }

        // After the published start, keep the stored date, time, and length
        // even if the form still posts those fields (disabled controls) or
        // someone tampers with them. Title, meeting point, and notes can
        // still change. Same freeze once anyone has clocked in during the
        // starting-soon window — rescheduling would rewrite opensAt/endsAt
        // under existing attendance rows.
        let nextStartsAt = startsAt;
        let nextDurationMins = durationMins;
        const attendanceCount = await tx.attendance.count({ where: { walkId: id } });
        const scheduleFrozen =
          isWalkScheduleLocked(locked.startsAt) || attendanceCount > 0;
        if (scheduleFrozen) {
          nextStartsAt = locked.startsAt;
          nextDurationMins = locked.durationMins;
        } else if (isWalkStartInThePast(startsAt)) {
          throw new LimitReachedError("Choose a start time that has not passed yet.");
        }

        // Keep the public /w/{slug} link stable unless the title’s place word
        // changes — allocateWalkSlug always mints a new suffix.
        const nextBase = walkSlugBase(parsed.data.title);
        const existingBase = locked.slug ? walkSlugNameBase(locked.slug) : null;
        const slug =
          locked.slug && existingBase === nextBase
            ? locked.slug
            : await allocateWalkSlug(parsed.data.title, id);

        const reopenAfterCancel = Boolean(shouldReopen && locked.cancelledAt);
        const reopenStatus = reopenAfterCancel
          ? walkStatus({
              cancelledAt: null,
              startsAt: nextStartsAt,
              durationMins: nextDurationMins,
              endedAt: locked.endedAt,
            })
          : null;

        const updated = await tx.walk.update({
          where: { id },
          data: {
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            startsAt: nextStartsAt,
            durationMins: nextDurationMins,
            location: parsed.data.location ?? null,
            postcode: pin.postcode,
            latitude: pin.latitude,
            longitude: pin.longitude,
            what3words: what3words.value,
            slug,
            ...(shouldReopen
              ? { cancelledAt: null, cancelledReason: null, retentionLocked: false }
              : {}),
          },
          select: { token: true, slug: true },
        });

        // Same Progress rule as reopenWalk — do not credit clock-ins from a
        // cancelled Starting-soon window once the meet is already over.
        if (reopenStatus === "completed") {
          await tx.attendance.deleteMany({ where: { walkId: id } });
        } else if (nextStartsAt.getTime() !== locked.startsAt.getTime()) {
          // Clock-in may already have opened in the hour before start while
          // the schedule was still editable — keep Art.9 purge dates aligned
          // with the published start so rescheduling cannot expire notes early.
          await tx.attendance.updateMany({
            where: { walkId: id, conditions: { not: null } },
            data: { conditionsPurgeAfter: conditionsPurgeAfterFromStartsAt(nextStartsAt) },
          });
        }

        return {
          existing: {
            cancelledAt: locked.cancelledAt,
            startsAt: locked.startsAt,
            durationMins: locked.durationMins,
            endedAt: locked.endedAt,
            token: locked.token,
            slug: locked.slug,
          },
          walk: updated,
          appliedStartsAt: nextStartsAt,
          appliedDurationMins: nextDurationMins,
        };
      });
      existing = result.existing;
      walk = result.walk;
      appliedStartsAt = result.appliedStartsAt;
      appliedDurationMins = result.appliedDurationMins;
      break;
    } catch (err) {
      if (err instanceof LimitReachedError) return { ok: false, error: err.message };
      if (err instanceof Error && err.message === "WALK_GONE") {
        return { ok: false, error: "That walk is no longer there." };
      }
      if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
      if (isPrismaCode(err, "P2002") && attempt < 4) continue;
      return logActionError("updateWalk", err, "Could not update this walk. Try again.");
    }
  }
  if (!walk || !existing) {
    return { ok: false, error: "Could not update this walk. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/walks");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidateWalkShare(existing);
  revalidateWalkShare(walk);

  // Only notify when this edit actually brought a cancelled walk back — not
  // on every ordinary edit, and not if it was already open. Skip once the
  // meet time has passed (in-progress or completed) — still mail for
  // upcoming and starting-soon. See reopenWalk.
  const reopenStatus = walkStatus({
    cancelledAt: null,
    startsAt: appliedStartsAt,
    durationMins: appliedDurationMins,
    endedAt: existing.endedAt,
  });
  const notifyReopened =
    existing.cancelledAt !== null &&
    shouldReopen &&
    (reopenStatus === "upcoming" || reopenStatus === "starting-soon");
  if (notifyReopened) {
    await notifyMembersOfWalkReopened({
      title: parsed.data.title,
      whenText: formatWalkDate(appliedStartsAt),
      durationText: formatWalkLength(appliedDurationMins),
      meetingPoint: meetingPointLabel(parsed.data.location, pin.postcode) || null,
      what3words: what3words.value,
      shareUrl: walkShareUrl(appUrl(), walk),
    });
  }

  return {
    ok: true,
    message: wasCancelled
      ? reopenStatus === "completed"
        ? "Walk updated and reopened in the record. Its time has already passed, so clock-in stays closed and any clock-ins from before it was cancelled were cleared (they do not count on Progress)."
        : reopenStatus === "in-progress"
          ? "Walk updated and reopened. Clock-in is already open — no email was sent."
          : "Walk updated and put back on the diary."
      : "Walk updated.",
  };
}

export async function deleteWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Deleting a walk is permanent and irreversible, so it stays owner-only —
  // organisers can't delete or remove anything.
  if (!(await isOwner(admin.id))) return ownerDenied("delete a walk");
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };
  // Fresh read — concurrent removeOwner must not leave a delete past a
  // stale React-cached isOwner from earlier in the request.
  if (!(await actorStillOwner(admin.id))) return ownerDenied("delete a walk");

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
  revalidatePath("/walks");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidateWalkShare(walk);
  return {
    ok: true,
    message: `“${walk.title}” has been removed.`,
    href: "/admin",
  };
}

/** Flags/unflags a cancelled walk to exempt it from the cancelled-walk
 * auto-delete cron (Settings → Data retention), regardless of the
 * configured days. Meaningless (and harmless) for a walk that isn't
 * cancelled — the cron only ever considers cancelled walks anyway. */
export async function setWalkRetentionLocked(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksExport) return permissionDenied("permWalksExport");
  const id = String(formData.get("walkId") ?? "");
  const locked = String(formData.get("retentionLocked") ?? "") === "on";
  if (!id) return { ok: false, error: "No walk selected." };

  try {
    const walk = await prisma.walk.findUnique({
      where: { id },
      select: { cancelledAt: true },
    });
    if (!walk) return { ok: false, error: "That walk is no longer there." };
    if (!walk.cancelledAt) {
      return {
        ok: false,
        error: "Only a cancelled walk can be flagged to keep past auto-delete.",
      };
    }

    await prisma.walk.update({ where: { id }, data: { retentionLocked: locked } });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk is no longer there." };
    return logActionError("setWalkRetentionLocked", err, "Could not save that. Try again.");
  }

  revalidatePath(`/admin/walks/${id}`);
  return {
    ok: true,
    message: locked
      ? "This walk is flagged — it won't be deleted automatically."
      : "This walk is no longer flagged — it will be deleted automatically like any other, once old enough.",
  };
}
