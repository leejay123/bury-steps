"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, requireUser, displayName } from "@/lib/auth";
import { londonWallClockToUtc } from "@/lib/dates";
import {
  geocodeFields,
  normalizeUkPostcode,
  parseFormPoint,
  searchPlaces,
  type PlaceHit,
} from "@/lib/geocode";
import {
  canOrganiserAddAttendance,
  canOrganiserEditJourney,
  isWalkScheduleLocked,
  isWalkStartInThePast,
  organiserRecordedClockInAt,
  walkStatus,
  windowState,
} from "@/lib/walk-window";
import {
  MAX_JOURNEY_BODY,
  MAX_JOURNEY_EVENTS,
  MAX_JOURNEY_TITLE,
} from "@/lib/walk-journey";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import {
  DEFAULT_TESTIMONIALS_SECTION_INTRO,
  DEFAULT_TESTIMONIALS_SECTION_TITLE,
  MAX_HOMEPAGE_TESTIMONIALS,
  parseTestimonialsSectionIntro,
  parseTestimonialsSectionTitle,
} from "@/lib/testimonials";
import {
  DEFAULT_FAQ_SECTION_INTRO,
  DEFAULT_FAQ_SECTION_TITLE,
  MAX_FAQ_CATEGORIES,
  MAX_FAQ_CATEGORY_LABEL,
  MAX_HOMEPAGE_FAQS,
  faqCategorySlug,
  parseFaqSectionIntro,
  parseFaqSectionTitle,
} from "@/lib/faqs";
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT,
  parseHomepageSectionOrder,
  serializeHomepageSectionOrder,
  type HomepageSectionId,
} from "@/lib/homepage-sections";
import {
  DEFAULT_ABOUT_EXPECT_TEXT,
  DEFAULT_ABOUT_GOALS_TEXT,
  DEFAULT_ABOUT_PLACES_TEXT,
  DEFAULT_ABOUT_RULES_TEXT,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_EYEBROW,
  DEFAULT_HOW_THIS_STARTED_TEASER,
  DEFAULT_HOW_THIS_STARTED_TITLE,
  MAX_ABOUT_LIST_ITEM,
  MAX_ABOUT_LIST_ITEMS,
  MAX_ABOUT_RULES,
  parseAboutList,
  parseAboutRules,
  parseHowThisStartedBody,
  parseHowThisStartedEyebrow,
  parseHowThisStartedTeaser,
  parseHowThisStartedTitle,
  serializeAboutList,
  serializeAboutRules,
} from "@/lib/homepage-copy";
import {
  MAX_NOTICE_CATEGORIES,
  MAX_NOTICE_CATEGORY_LABEL,
  MAX_NOTICE_TITLE,
  MAX_NOTICE_BELL_BODY,
  MAX_NOTICE_TEASER,
  MAX_NOTICE_PAGE_BODY,
  WELCOME_NOTICE_SYSTEM_KEY,
  noticeBodyForBellDrawer,
  noticeCategorySlug,
  noticePageSlug,
  noticesForBell,
} from "@/lib/notices";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { NOTICES_CACHE_TAG, getSiteNoticeState, recordSiteNoticeRead } from "@/lib/site-notices";
import { isAllowedImageMime, sniffImageMime } from "@/lib/image-bytes";
import { stripImageMetadata } from "@/lib/strip-image-metadata";
import { checkRateLimit } from "@/lib/rate-limit";
import { allocateWalkSlug } from "@/lib/walk-slug";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  DEFAULT_COOKIE_CONSENT_VARIANT,
  parseCookieConsentVariant,
} from "@/lib/cookie-consent-variant";
import {
  DEFAULT_FACEBOOK_GROUP_URL,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_TAGLINE,
  parseFacebookGroupUrl,
  parseSiteName,
  parseSiteTagline,
} from "@/lib/site-branding";
import { MAX_MONTHLY_CLOCK_IN_GOAL } from "@/lib/walk-game";
import {
  DEFAULT_FAQS,
  DEFAULT_FAQ_CATEGORIES,
  DEFAULT_HERO_SLIDE,
  DEFAULT_TESTIMONIALS,
  DEFAULT_WELCOME_NOTICE,
} from "@/lib/site-defaults";
import { isResetConfirmWord } from "@/lib/site-reset";
import { safeAppPath } from "@/lib/urls";

/** Stable unguessable id for clock-in forms. Old /w/<token> links still work. */
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 12);
const slugSuffix = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 6);

function revalidateWalkShare(walk: { token: string; slug?: string | null }) {
  revalidatePath(`/w/${walk.token}`);
  if (walk.slug) revalidatePath(`/w/${walk.slug}`);
}

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

/**
 * Logs the real error server-side (Next.js otherwise only shows the caller a
 * generic "something went wrong" for anything thrown out of a server
 * action) and returns a friendly, generic failure for the UI. Never call
 * this around `requireAdmin()`/`requireUser()` — they use `notFound()` /
 * `redirect()`, which work by throwing, and that throw must keep propagating.
 */
function logActionError(context: string, err: unknown, fallback = "Something went wrong. Try again."): ActionResult {
  console.error(`[actions:${context}]`, err);
  return { ok: false, error: fallback };
}

export type ActionResult =
  | { ok: true; message?: string; href?: string }
  | { ok: false; error: string };

/** Thrown by a locked count-check to signal "this would exceed the
 * configured limit" — told apart from a genuine, unexpected DB error so it
 * can be reported with its own message instead of the generic
 * logActionError fallback. */
class LimitReachedError extends Error {}

/**
 * Serializes a "count existing rows, reject if at the limit, otherwise
 * create one" operation across concurrent admin requests. Under the
 * default Read Committed isolation level, two admins hitting "Add" at the
 * same instant can each see a count under the limit and both insert,
 * exceeding it (and, for sortOrder-by-count callers, colliding on the same
 * sortOrder value) — the same class of race `syncLocalUser`'s advisory
 * lock solves for the admin-bootstrap check. `fn` must do all of its reads
 * and writes through the given transaction client, not the top-level
 * `prisma`, since the lock is scoped to (and released at the end of) this
 * transaction.
 */
async function withCountLimitLock<T>(
  lockKey: number,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);
    return fn(tx);
  });
}

// ---------------------------------------------------------------- create walk

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

// ---------------------------------------------------------------- cancel walk

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

// -------------------------------------------------------------- journey

const journeyEventSchema = z.object({
  walkId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, "Add a short title.")
    .max(MAX_JOURNEY_TITLE, `Keep the title under ${MAX_JOURNEY_TITLE} characters.`),
  body: z
    .string()
    .trim()
    .max(MAX_JOURNEY_BODY, `Keep the notes under ${MAX_JOURNEY_BODY} characters.`)
    .optional(),
  happenedAt: z
    .string()
    .min(1, "Pick a time.")
    .refine((value) => !Number.isNaN(londonWallClockToUtc(value).getTime()), "Pick a valid time."),
});

export async function createJourneyEvent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = journeyEventSchema.safeParse({
    walkId: formData.get("walkId"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    happenedAt: formData.get("happenedAt"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const walk = await tx.walk.findUnique({
        where: { id: parsed.data.walkId },
        select: {
          id: true,
          token: true,
          slug: true,
          startsAt: true,
          durationMins: true,
          cancelledAt: true,
          _count: { select: { journeyEvents: true } },
        },
      });
      if (!walk) throw new Error("WALK_GONE");
      if (!canOrganiserEditJourney(walk)) {
        throw new LimitReachedError(
          walk.cancelledAt
            ? "Cancelled walks keep their journey, but you cannot add more."
            : "Journey events can be added once the walk has started.",
        );
      }
      if (walk._count.journeyEvents >= MAX_JOURNEY_EVENTS) {
        throw new LimitReachedError(`You can keep up to ${MAX_JOURNEY_EVENTS} events on a walk.`);
      }

      await tx.walkJourneyEvent.create({
        data: {
          walkId: walk.id,
          title: parsed.data.title,
          body: parsed.data.body || null,
          happenedAt: londonWallClockToUtc(parsed.data.happenedAt),
          createdById: admin.id,
        },
      });

      return walk;
    });

    const walk = await prisma.walk.findUnique({
      where: { id: parsed.data.walkId },
      select: { id: true, token: true, slug: true },
    });
    if (walk) {
      revalidatePath(`/admin/walks/${walk.id}`);
      revalidateWalkShare(walk);
    }
    return { ok: true, message: "Event added to the journey." };
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "WALK_GONE") {
      return { ok: false, error: "That walk is no longer there." };
    }
    return logActionError("createJourneyEvent", err);
  }
}

export async function updateJourneyEvent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = journeyEventSchema
    .extend({ eventId: z.string().min(1) })
    .safeParse({
      eventId: formData.get("eventId"),
      walkId: formData.get("walkId"),
      title: formData.get("title"),
      body: formData.get("body") || undefined,
      happenedAt: formData.get("happenedAt"),
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const walk = await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const existing = await tx.walkJourneyEvent.findUnique({
        where: { id: parsed.data.eventId },
        select: {
          id: true,
          walkId: true,
          walk: {
            select: {
              id: true,
              token: true,
              slug: true,
              startsAt: true,
              durationMins: true,
              cancelledAt: true,
            },
          },
        },
      });
      if (!existing || existing.walkId !== parsed.data.walkId) {
        throw new Error("EVENT_GONE");
      }
      if (!canOrganiserEditJourney(existing.walk)) {
        throw new LimitReachedError(
          existing.walk.cancelledAt
            ? "Cancelled walks keep their journey, but you cannot edit it."
            : "Journey events can be edited once the walk has started.",
        );
      }

      await tx.walkJourneyEvent.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          body: parsed.data.body || null,
          happenedAt: londonWallClockToUtc(parsed.data.happenedAt),
        },
      });

      return existing.walk;
    });

    revalidatePath(`/admin/walks/${walk.id}`);
    revalidateWalkShare(walk);
    return { ok: true, message: "Event updated." };
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "EVENT_GONE") {
      return { ok: false, error: "That event is no longer there." };
    }
    return logActionError("updateJourneyEvent", err);
  }
}

export async function deleteJourneyEvent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { ok: false, error: "That event is no longer there." };

  try {
    const walk = await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.journeyEvent, async (tx) => {
      const existing = await tx.walkJourneyEvent.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          walk: {
            select: {
              id: true,
              token: true,
              slug: true,
              startsAt: true,
              durationMins: true,
              cancelledAt: true,
            },
          },
        },
      });
      if (!existing) throw new Error("EVENT_GONE");
      if (!canOrganiserEditJourney(existing.walk)) {
        throw new LimitReachedError(
          existing.walk.cancelledAt
            ? "Cancelled walks keep their journey as it is."
            : "Journey events can be removed once the walk has started.",
        );
      }

      await tx.walkJourneyEvent.delete({ where: { id: existing.id } });
      return existing.walk;
    });

    revalidatePath(`/admin/walks/${walk.id}`);
    revalidateWalkShare(walk);
    return { ok: true, message: "Event removed." };
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "EVENT_GONE") {
      return { ok: false, error: "That event is no longer there." };
    }
    return logActionError("deleteJourneyEvent", err);
  }
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

  const limited = checkRateLimit(`${user.id}:clockIn`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

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

  let walk: {
    id: string;
    token: string;
    slug: string | null;
    startsAt: Date;
    durationMins: number;
  };

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          token: string;
          slug: string | null;
          startsAt: Date;
          durationMins: number;
          cancelledAt: Date | null;
        }>
      >`SELECT id, token, slug, "startsAt", "durationMins", "cancelledAt"
        FROM "Walk" WHERE token = ${parsed.data.token} FOR UPDATE`;
      const locked = rows[0];
      if (!locked) return { ok: false as const, error: "This walk link is not valid." };
      if (locked.cancelledAt) {
        // Same copy as a missing token so cancellation is not an oracle.
        return { ok: false as const, error: "This walk link is not valid." };
      }

      const state = windowState(locked.startsAt, locked.durationMins);
      if (state === "too-early") {
        return { ok: false as const, error: "Clock-in opens an hour before the walk starts." };
      }
      if (state === "closed") {
        return {
          ok: false as const,
          error: "Clock-in for this walk has closed. Speak to an organiser.",
        };
      }

      const purgeAfter = new Date(
        locked.startsAt.getTime() + CONDITIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      const attendanceData = {
        medicalAckAt: new Date(),
        conditions: parsed.data.hasConditions === "yes" ? parsed.data.conditions! : null,
        conditionsPurgeAfter: purgeAfter,
        clockedOutAt: null,
        clockedOutReason: null,
      };

      const reclockedIn = await tx.attendance.updateMany({
        where: { walkId: locked.id, userId: user.id, clockedOutAt: { not: null } },
        data: { ...attendanceData, clockedInAt: new Date() },
      });

      if (reclockedIn.count === 0) {
        await tx.attendance.create({
          data: {
            walkId: locked.id,
            userId: user.id,
            ...attendanceData,
          },
        });
      }

      return {
        ok: true as const,
        walk: {
          id: locked.id,
          token: locked.token,
          slug: locked.slug,
          startsAt: locked.startsAt,
          durationMins: locked.durationMins,
        },
      };
    });

    if (!outcome.ok) return { ok: false, error: outcome.error };
    walk = outcome.walk;
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      return { ok: false, error: "You are already clocked in for this walk." };
    }
    return logActionError("clockIn:write", err, "Could not clock you in right now. Try again.");
  }

  revalidateWalkShare(walk);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/walks/${walk.id}`);
  return { ok: true, message: "Clocked in. Enjoy the walk." };
}

const adminClockInSchema = z.object({
  walkId: z.string().min(1),
  userId: z.string().min(1, "Choose who to add."),
});

/** Cap for the Add someone picker so thousands of members never flood the dialog. */
const ADDABLE_MEMBER_LIMIT = 40;

export async function searchAddableMembers(
  walkId: string,
  query: string,
): Promise<{ id: string; label: string }[]> {
  await requireAdmin();
  if (!walkId) return [];

  const walk = await prisma.walk.findUnique({
    where: { id: walkId },
    select: {
      id: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
      attendances: { select: { userId: true, clockedOutAt: true } },
    },
  });
  if (!walk || !canOrganiserAddAttendance(walk)) return [];

  // While the window is open, clocked-out members can be re-added. Once it
  // has closed, anyone with any attendance row is already on the roster.
  const excludeIds =
    windowState(walk.startsAt, walk.durationMins) === "closed"
      ? walk.attendances.map((row) => row.userId)
      : walk.attendances.filter((row) => !row.clockedOutAt).map((row) => row.userId);
  const needle = query.trim();
  const where = {
    ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    ...(needle
      ? {
          OR: [
            { firstName: { contains: needle, mode: "insensitive" as const } },
            { lastName: { contains: needle, mode: "insensitive" as const } },
            { email: { contains: needle, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const members = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
    take: ADDABLE_MEMBER_LIMIT,
  });

  return members.map((member) => {
    const name = displayName(member);
    return {
      id: member.id,
      label: name === member.email ? member.email : `${name} · ${member.email}`,
    };
  });
}

export async function adminClockIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminClockInSchema.safeParse({
    walkId: formData.get("walkId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const member = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!member) return { ok: false, error: "That member is no longer there." };

  let walk: { id: string; token: string; slug: string | null };
  let window: ReturnType<typeof windowState>;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          token: string;
          slug: string | null;
          startsAt: Date;
          durationMins: number;
          cancelledAt: Date | null;
        }>
      >`SELECT id, token, slug, "startsAt", "durationMins", "cancelledAt"
        FROM "Walk" WHERE id = ${parsed.data.walkId} FOR UPDATE`;
      const locked = rows[0];
      if (!locked) return { ok: false as const, error: "That walk is no longer there." };
      if (!canOrganiserAddAttendance(locked)) {
        if (locked.cancelledAt) {
          return { ok: false as const, error: "Reopen this walk before adding someone to it." };
        }
        return {
          ok: false as const,
          error: "You can add someone from an hour before the walk starts.",
        };
      }

      const existingAttendance = await tx.attendance.findUnique({
        where: { walkId_userId: { walkId: locked.id, userId: member.id } },
        select: { id: true, clockedOutAt: true },
      });

      const win = windowState(locked.startsAt, locked.durationMins);
      if (existingAttendance) {
        if (win === "closed" || !existingAttendance.clockedOutAt) {
          return {
            ok: false as const,
            error: `${displayName(member)} is already on this walk’s list.`,
          };
        }
      }

      const now = new Date();
      const clockedInAt = organiserRecordedClockInAt(locked, now);
      const purgeAfter = new Date(
        locked.startsAt.getTime() + CONDITIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      const attendanceData = {
        clockedInAt,
        medicalAckAt: now,
        conditions: null,
        conditionsPurgeAfter: purgeAfter,
        clockedOutAt: null,
        clockedOutReason: null,
      };

      if (existingAttendance) {
        await tx.attendance.update({
          where: { id: existingAttendance.id },
          data: attendanceData,
        });
      } else {
        await tx.attendance.create({
          data: {
            walkId: locked.id,
            userId: member.id,
            ...attendanceData,
          },
        });
      }

      return {
        ok: true as const,
        walk: { id: locked.id, token: locked.token, slug: locked.slug },
        window: win,
      };
    });

    if (!outcome.ok) return { ok: false, error: outcome.error };
    walk = outcome.walk;
    window = outcome.window;
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      return { ok: false, error: `${displayName(member)} is already on this walk’s list.` };
    }
    return logActionError("adminClockIn", err, "Could not add them to this walk. Try again.");
  }

  revalidateWalkShare(walk);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath(`/admin/walks/${walk.id}`);
  revalidatePath(`/admin/members/${member.id}`);
  revalidatePath("/admin/members");
  return {
    ok: true,
    message:
      window === "closed"
        ? `${displayName(member)} has been added as attending this walk.`
        : `${displayName(member)} has been clocked in.`,
  };
}

const adminRemoveAttendanceSchema = z.object({
  attendanceId: z.string().min(1),
});

export async function adminRemoveAttendance(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminRemoveAttendanceSchema.safeParse({
    attendanceId: formData.get("attendanceId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: parsed.data.attendanceId },
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      walk: {
        select: {
          id: true,
          token: true,
          slug: true,
          cancelledAt: true,
        },
      },
    },
  });
  if (!attendance) return { ok: false, error: "That person is no longer on this walk." };

  try {
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; cancelledAt: Date | null }>>`
        SELECT id, "cancelledAt" FROM "Walk" WHERE id = ${attendance.walk.id} FOR UPDATE`;
      const locked = rows[0];
      if (!locked) throw new Error("WALK_GONE");
      if (locked.cancelledAt) {
        throw new LimitReachedError("Reopen this walk before removing someone from it.");
      }
      await tx.attendance.delete({ where: { id: attendance.id } });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "WALK_GONE") {
      return { ok: false, error: "That walk is no longer there." };
    }
    if (isPrismaCode(err, "P2025")) {
      return { ok: false, error: "That person is no longer on this walk." };
    }
    return logActionError(
      "adminRemoveAttendance",
      err,
      "Could not remove them from this walk. Try again.",
    );
  }

  revalidateWalkShare(attendance.walk);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath(`/admin/walks/${attendance.walk.id}`);
  revalidatePath(`/admin/members/${attendance.userId}`);
  revalidatePath("/admin/members");
  return {
    ok: true,
    message: `${displayName(attendance.user)} has been removed from this walk.`,
  };
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

  const limited = checkRateLimit(`${user.id}:clockOut`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const parsed = clockOutSchema.safeParse({
    token: formData.get("token"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let walk: {
    id: string;
    token: string;
    slug: string | null;
  } | null;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          token: string;
          slug: string | null;
          startsAt: Date;
          durationMins: number;
          cancelledAt: Date | null;
        }>
      >`SELECT id, token, slug, "startsAt", "durationMins", "cancelledAt"
        FROM "Walk" WHERE token = ${parsed.data.token} FOR UPDATE`;
      const locked = rows[0];
      if (!locked || locked.cancelledAt) {
        return { ok: false as const, error: "This walk link is not valid." };
      }

      // Clocking out is for leaving early (or right at the end) while the walk
      // is still under way — once its window has fully closed there's nothing
      // left to leave early from. Anyone who never clocked out by then simply
      // stayed for the whole walk, which needs no action from them.
      if (windowState(locked.startsAt, locked.durationMins) === "closed") {
        return {
          ok: false as const,
          error: "This walk has finished — there's no need to clock out.",
        };
      }

      const clockedOut = await tx.attendance.updateMany({
        where: { walkId: locked.id, userId: user.id, clockedOutAt: null },
        data: {
          clockedOutAt: new Date(),
          clockedOutReason: parsed.data.reason,
        },
      });
      if (clockedOut.count === 0) {
        return { ok: false as const, error: "You are not clocked in for this walk." };
      }

      return {
        ok: true as const,
        walk: { id: locked.id, token: locked.token, slug: locked.slug },
      };
    });

    if (!outcome.ok) return { ok: false, error: outcome.error };
    walk = outcome.walk;
  } catch (err) {
    return logActionError("clockOut:write", err, "Could not clock you out right now. Try again.");
  }

  revalidateWalkShare(walk);
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

  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== "confirm") {
    return { ok: false, error: "Type Confirm to remove this member." };
  }

  if (id === admin.id) {
    return { ok: false, error: "You cannot delete your own account from here." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      clerkId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });
  if (!target) return { ok: false, error: "That member is no longer in the group." };

  // Do the database side first. It is transactional and fully reversible on
  // failure, unlike removing their Clerk login below — if this fails, we
  // want to bail out having changed nothing rather than leave someone with
  // a dead login but a database row that still says they're a member.
  // Last-organiser check is inside the same advisory lock as demote so two
  // concurrent deletes cannot leave the group with zero admins.
  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastAdmin, async (tx) => {
      const fresh = await tx.user.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          role: true,
          _count: {
            select: {
              walksCreated: true,
              accidentReports: true,
              journeyEvents: true,
            },
          },
        },
      });
      if (!fresh) throw new Error("MEMBER_GONE");
      if (fresh.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) throw new LimitReachedError("You cannot delete the last organiser.");
      }
      if (fresh._count.walksCreated > 0) {
        await tx.walk.updateMany({
          where: { createdById: fresh.id },
          data: { createdById: admin.id },
        });
      }
      if (fresh._count.accidentReports > 0) {
        await tx.accidentReport.updateMany({
          where: { createdById: fresh.id },
          data: { createdById: admin.id },
        });
      }
      if (fresh._count.journeyEvents > 0) {
        await tx.walkJourneyEvent.updateMany({
          where: { createdById: fresh.id },
          data: { createdById: admin.id },
        });
      }
      await tx.user.delete({ where: { id: fresh.id } });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "MEMBER_GONE") {
      return { ok: false, error: "That member is no longer in the group." };
    }
    console.error("deleteMember: database removal failed", err);
    return { ok: false, error: "Could not remove this member. Try again." };
  }

  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const href = safeAppPath(redirectTo);

  const clerk = await clerkClient();
  try {
    await clerk.users.deleteUser(target.clerkId);
  } catch (err) {
    if (!isNotFoundStatus(err)) {
      // The database side already succeeded — they're gone from the group
      // either way. Say so, but flag that their login may still work until
      // it's removed from Clerk directly.
      console.error("deleteMember: Clerk login removal failed after database removal", err);
      revalidatePath("/admin");
      revalidatePath("/admin/members");
      revalidatePath("/dashboard");
      return {
        ok: true,
        message: `${displayName(target)} has been removed from the group, but their sign-in could not be revoked automatically — remove it from Clerk if needed.`,
        ...(href ? { href } : {}),
      };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `${displayName(target)} has been removed from the group.`,
    ...(href ? { href } : {}),
  };
}

/**
 * Promote a member to organiser, or demote an organiser to member. The group
 * must always keep at least one organiser — demoting the last one is blocked.
 */
export async function setMemberRole(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const limited = checkRateLimit(`${admin.id}:setMemberRole`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const id = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (!id) return { ok: false, error: "No member selected." };
  if (confirm !== "confirm") {
    return { ok: false, error: "Type confirm to change their role." };
  }
  if (roleRaw !== "ADMIN" && roleRaw !== "MEMBER") {
    return { ok: false, error: "Choose organiser or member." };
  }
  const role = roleRaw as "ADMIN" | "MEMBER";

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role === role) {
    return {
      ok: true,
      message:
        role === "ADMIN"
          ? `${displayName(target)} is already an organiser.`
          : `${displayName(target)} is already a member.`,
    };
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastAdmin, async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: target.id } });
      if (!fresh) throw new Error("MEMBER_GONE");
      if (fresh.role === role) return;
      if (role === "MEMBER" && fresh.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          throw new LimitReachedError("You cannot demote the last organiser.");
        }
      }
      await tx.user.update({ where: { id: fresh.id }, data: { role } });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "MEMBER_GONE") {
      return { ok: false, error: "That member is no longer in the group." };
    }
    return logActionError("setMemberRole", err, "Could not change their role. Try again.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath("/dashboard");
  // Layout nav (Members / Reports / Settings) depends on role for this person.
  revalidatePath("/", "layout");

  return {
    ok: true,
    message:
      role === "ADMIN"
        ? `${displayName(target)} is now an organiser.`
        : `${displayName(target)} is now a member.`,
  };
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
  const raw = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  const mime = sniffImageMime(raw);
  if (!mime || !isAllowedImageMime(mime)) {
    return { error: "Use a JPEG, PNG or WebP image." };
  }
  // These are public-facing photos — strip EXIF/XMP metadata (which on a
  // phone photo usually includes exact GPS coordinates) before it's ever
  // written to the database.
  const data = stripImageMetadata(raw, mime) as Uint8Array<ArrayBuffer>;
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

/**
 * Reorder actions are called directly as server actions (not through a
 * `<form>`/FormData submission), so — unlike everywhere else in this file —
 * there is no schema parsing step forcing the payload's shape before it
 * reaches here. `ids` is typed `string[]` for our own call sites, but a
 * request hitting the action's endpoint directly can send anything; check
 * it actually is a reasonably-sized array of strings before doing anything
 * with it. `maxLength` should be comfortably above the resource's own
 * configured limit so a legitimate reorder is never rejected.
 */
function validateReorderIds(ids: unknown, maxLength: number): string[] | { error: string } {
  const invalid = { error: "Could not save that order. Try again." };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > maxLength) return invalid;
  if (!ids.every((id) => typeof id === "string" && id.length > 0 && id.length <= 100)) return invalid;
  return ids;
}

async function applySortOrder(
  ids: string[],
  existing: { id: string }[],
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const allowed = new Set(existing.map((row) => row.id));
  const next = [...new Set(ids.filter((id) => allowed.has(id)))];
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

async function uniqueFaqCategorySlug(tx: Prisma.TransactionClient, label: string): Promise<string> {
  const base = faqCategorySlug(label);
  let slug = base;
  let n = 2;
  while (
    await tx.homepageFaqCategory.findFirst({
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

  const copy = await readFaqCopy(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaq, async (tx) => {
      const count = await tx.homepageFaq.count();
      if (count >= MAX_HOMEPAGE_FAQS) {
        throw new LimitReachedError("You can have up to 20 FAQs.");
      }
      await tx.homepageFaq.create({
        data: {
          sortOrder: count,
          categoryId: copy.categoryId,
          question: copy.question,
          answer: copy.answer,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    return logActionError("addHomepageFaq", err, "Could not add that FAQ. Try again.");
  }

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
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateHomepageFaq", err);
    return { ok: false, error: "That FAQ is no longer there." };
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ saved." };
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
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteHomepageFaq", err);
    return { ok: false, error: "That FAQ is no longer there." };
  }

  try {
    const remaining = await prisma.homepageFaq.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((row, index) =>
        prisma.homepageFaq.update({ where: { id: row.id }, data: { sortOrder: index } }),
      ),
    );
  } catch (err) {
    logActionError("deleteHomepageFaq:resort", err);
  }

  revalidateHomepage();
  return { ok: true, message: "FAQ removed." };
}

// ------------------------------------------------------------------ site notices

function revalidateNotices(paths: string[] = []) {
  revalidateTag(NOTICES_CACHE_TAG);
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

export async function updateCarouselEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const enabled = String(formData.get("carouselEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: enabled,
      },
      update: { carouselEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateCarouselEnabled", err, "Could not save that setting. Try again.");
  }

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

  try {
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
  } catch (err) {
    return logActionError("updateScrollToTopEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: enabled ? "Back to top is on." : "Back to top is off." };
}

export async function updateCookieConsentVariant(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const variant = parseCookieConsentVariant(String(formData.get("cookieConsentVariant") ?? ""));
  if (!variant) {
    return { ok: false, error: "Choose a cookie notice layout." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: variant,
      },
      update: { cookieConsentVariant: variant },
    });
  } catch (err) {
    return logActionError("updateCookieConsentVariant", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return {
    ok: true,
    message:
      variant === "default"
        ? "Cookie notice set to the full layout."
        : variant === "mini"
          ? "Cookie notice set to the mini layout."
          : "Cookie notice set to the compact layout.",
  };
}

export async function updateSiteBranding(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const siteName = parseSiteName(String(formData.get("siteName") ?? ""));
  const siteTagline = parseSiteTagline(String(formData.get("siteTagline") ?? ""));
  if (siteName === "invalid") {
    return { ok: false, error: "Give the site a name of 2–80 characters." };
  }
  if (siteTagline === "invalid") {
    return { ok: false, error: "Give a short tagline of 8–220 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        siteName,
        siteTagline,
      },
      update: { siteName, siteTagline },
    });
  } catch (err) {
    return logActionError("updateSiteBranding", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Site name and tagline saved." };
}

export async function updateFacebookGroupUrl(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const facebookGroupUrl = parseFacebookGroupUrl(String(formData.get("facebookGroupUrl") ?? ""));
  if (facebookGroupUrl === "invalid") {
    return {
      ok: false,
      error: "Enter a full https Facebook group link, or leave it blank to hide the link.",
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        facebookGroupUrl,
      },
      update: { facebookGroupUrl },
    });
  } catch (err) {
    return logActionError("updateFacebookGroupUrl", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return {
    ok: true,
    message: facebookGroupUrl
      ? "Facebook group link saved."
      : "Facebook group link hidden.",
  };
}

export async function reorderHomepageSections(ids: HomepageSectionId[]): Promise<ActionResult> {
  await requireAdmin();
  const order = parseHomepageSectionOrder(serializeHomepageSectionOrder(ids));
  if (order === "invalid") {
    return { ok: false, error: "Could not save that order. Try again." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        homepageSectionOrder: serializeHomepageSectionOrder(order),
      },
      update: { homepageSectionOrder: serializeHomepageSectionOrder(order) },
    });
  } catch (err) {
    return logActionError("reorderHomepageSections", err, "Could not save that order. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Homepage section order saved." };
}

export async function updateFaqSectionCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const faqSectionTitle = parseFaqSectionTitle(String(formData.get("faqSectionTitle") ?? ""));
  const faqSectionIntro = parseFaqSectionIntro(String(formData.get("faqSectionIntro") ?? ""));
  if (faqSectionTitle === "invalid") {
    return { ok: false, error: "Give the FAQs a heading of 2–80 characters." };
  }
  if (faqSectionIntro === "invalid") {
    return { ok: false, error: "Give a short intro of 8–280 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        faqSectionTitle,
        faqSectionIntro,
      },
      update: { faqSectionTitle, faqSectionIntro },
    });
  } catch (err) {
    return logActionError("updateFaqSectionCopy", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "FAQ heading and intro saved." };
}

export async function updateTestimonialsSectionCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const testimonialsSectionTitle = parseTestimonialsSectionTitle(
    String(formData.get("testimonialsSectionTitle") ?? ""),
  );
  const testimonialsSectionIntro = parseTestimonialsSectionIntro(
    String(formData.get("testimonialsSectionIntro") ?? ""),
  );
  if (testimonialsSectionTitle === "invalid") {
    return { ok: false, error: "Give testimonials a heading of 2–80 characters." };
  }
  if (testimonialsSectionIntro === "invalid") {
    return { ok: false, error: "Give a short intro of 8–280 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        testimonialsSectionTitle,
        testimonialsSectionIntro,
      },
      update: { testimonialsSectionTitle, testimonialsSectionIntro },
    });
  } catch (err) {
    return logActionError(
      "updateTestimonialsSectionCopy",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Testimonials heading and intro saved." };
}

export async function updateHowThisStartedCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const howThisStartedTitle = parseHowThisStartedTitle(
    String(formData.get("howThisStartedTitle") ?? ""),
  );
  const howThisStartedEyebrow = parseHowThisStartedEyebrow(
    String(formData.get("howThisStartedEyebrow") ?? ""),
  );
  const howThisStartedTeaser = parseHowThisStartedTeaser(
    String(formData.get("howThisStartedTeaser") ?? ""),
  );
  const howThisStartedBody = parseHowThisStartedBody(
    String(formData.get("howThisStartedBody") ?? ""),
  );
  if (howThisStartedTitle === "invalid") {
    return { ok: false, error: "Give How this started a heading of 2–80 characters." };
  }
  if (howThisStartedEyebrow === "invalid") {
    return { ok: false, error: "Keep the eyebrow under 80 characters, or leave it blank." };
  }
  if (howThisStartedTeaser === "invalid") {
    return { ok: false, error: "Give a short homepage blurb of 8–400 characters." };
  }
  if (howThisStartedBody === "invalid") {
    return { ok: false, error: "Give the full story at least 40 characters (up to 12,000)." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        howThisStartedTitle,
        howThisStartedEyebrow,
        howThisStartedTeaser,
        howThisStartedBody,
      },
      update: {
        howThisStartedTitle,
        howThisStartedEyebrow,
        howThisStartedTeaser,
        howThisStartedBody,
      },
    });
  } catch (err) {
    return logActionError(
      "updateHowThisStartedCopy",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "How this started copy saved." };
}

export async function updateAboutLists(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const aboutGoals = parseAboutList(String(formData.get("aboutGoals") ?? ""));
  const aboutPlaces = parseAboutList(String(formData.get("aboutPlaces") ?? ""));
  const aboutExpect = parseAboutList(String(formData.get("aboutExpect") ?? ""));
  const aboutRules = parseAboutRules(String(formData.get("aboutRules") ?? ""));
  if (aboutGoals === "invalid") {
    return {
      ok: false,
      error: `Goals need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutPlaces === "invalid") {
    return {
      ok: false,
      error: `Places need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutExpect === "invalid") {
    return {
      ok: false,
      error: `“What you can expect” needs 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutRules === "invalid") {
    return {
      ok: false,
      error: `Rules need 1–${MAX_ABOUT_RULES} lines as “Title | Body”.`,
    };
  }

  const aboutGoalsText = serializeAboutList(aboutGoals);
  const aboutPlacesText = serializeAboutList(aboutPlaces);
  const aboutExpectText = serializeAboutList(aboutExpect);
  const aboutRulesText = serializeAboutRules(aboutRules);

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        aboutGoals: aboutGoalsText,
        aboutPlaces: aboutPlacesText,
        aboutExpect: aboutExpectText,
        aboutRules: aboutRulesText,
      },
      update: {
        aboutGoals: aboutGoalsText,
        aboutPlaces: aboutPlacesText,
        aboutExpect: aboutExpectText,
        aboutRules: aboutRulesText,
      },
    });
  } catch (err) {
    return logActionError("updateAboutLists", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "About lists saved." };
}

/** Latest notices for the signed-in homepage carousel (same set as the bell). */

function parseMonthlyClockInGoal(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "invalid";
  const n = Number(trimmed);
  if (n === 0) return null;
  if (n > MAX_MONTHLY_CLOCK_IN_GOAL) return "invalid";
  return n;
}

export async function updateMonthlyClockInGoal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseMonthlyClockInGoal(String(formData.get("monthlyClockInGoal") ?? ""));
  if (parsed === "invalid") {
    return {
      ok: false,
      error: `Enter a whole number from 1 to ${MAX_MONTHLY_CLOCK_IN_GOAL.toLocaleString("en-GB")}, or leave it blank.`,
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        monthlyClockInGoal: parsed,
      },
      update: { monthlyClockInGoal: parsed },
    });
  } catch (err) {
    return logActionError("updateMonthlyClockInGoal", err, "Could not save that setting. Try again.");
  }

  revalidatePath("/dashboard/progress");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/progress");
  return {
    ok: true,
    message: parsed
      ? `Together goal is ${parsed.toLocaleString("en-GB")} clock-ins this month.`
      : "Together goal is off.",
  };
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

export async function reorderHomepageFaqs(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_HOMEPAGE_FAQS * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageFaq.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageFaq.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageFaqs", err, "Could not save that order. Try again.");
  }
  revalidateHomepage();
  return { ok: true };
}

export async function addHomepageFaqCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const copy = readCategoryLabel(formData);
  if ("error" in copy) return { ok: false, error: copy.error };

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaqCategory, async (tx) => {
      const count = await tx.homepageFaqCategory.count();
      if (count >= MAX_FAQ_CATEGORIES) {
        throw new LimitReachedError(`You can have up to ${MAX_FAQ_CATEGORIES} categories.`);
      }
      await tx.homepageFaqCategory.create({
        data: {
          label: copy.label,
          slug: await uniqueFaqCategorySlug(tx, copy.label),
          sortOrder: count,
        },
      });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    // Two categories with the same name created at the same moment can both
    // pass the slug-uniqueness check above before either commits.
    if (isPrismaCode(err, "P2002")) {
      return { ok: false, error: "A category with that name was just added. Try a different name." };
    }
    return logActionError("addHomepageFaqCategory", err, "Could not add that category. Try again.");
  }

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
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateHomepageFaqCategory", err);
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

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.homepageFaqCategory, async (tx) => {
      const category = await tx.homepageFaqCategory.findUnique({
        where: { id },
        select: { id: true, _count: { select: { faqs: true } } },
      });
      if (!category) throw new Error("CATEGORY_GONE");

      const remaining = await tx.homepageFaqCategory.count();
      if (remaining <= 1) {
        throw new LimitReachedError("Keep at least one category.");
      }
      if (category._count.faqs > 0) {
        throw new LimitReachedError("Move or remove the FAQs in this category first.");
      }

      await tx.homepageFaqCategory.delete({ where: { id } });

      const leftover = await tx.homepageFaqCategory.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      for (const [index, row] of leftover.entries()) {
        await tx.homepageFaqCategory.update({
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
    return logActionError("deleteHomepageFaqCategory", err, "Could not remove that category. Try again.");
  }

  revalidateHomepage();
  return { ok: true, message: "Category removed." };
}

export async function reorderHomepageFaqCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const validated = validateReorderIds(ids, MAX_FAQ_CATEGORIES * 2);
  if ("error" in validated) return { ok: false, error: validated.error };
  try {
    const existing = await prisma.homepageFaqCategory.findMany({ select: { id: true } });
    await applySortOrder(validated, existing, (id, sortOrder) =>
      prisma.homepageFaqCategory.update({ where: { id }, data: { sortOrder } }),
    );
  } catch (err) {
    return logActionError("reorderHomepageFaqCategories", err, "Could not save that order. Try again.");
  }
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
  /** The real total, independent of how many `items` were actually fetched. */
  attendanceCount: number;
  isYou: boolean;
  items: MemberHistoryItem[];
} | null> {
  const admin = await requireAdmin();
  const [member, attendanceCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { walksCreated: true } },
        attendances: {
          orderBy: { clockedInAt: "desc" },
          // Backstop against an unbounded query — someone would need to have
          // clocked in on a weekly walk every week for ~19 years to hit this,
          // and it keeps the most recent walks, which is what an organiser
          // actually wants to see first. `attendanceCount` below (a separate,
          // uncapped count) is what's shown as the real total, so a
          // long-standing member never gets stuck reading "1000 walks"
          // forever once they pass this cap.
          take: 1000,
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
    }),
    prisma.attendance.count({ where: { userId } }),
  ]);
  if (!member) return null;

  return {
    name: displayName(member),
    email: member.email,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
    walkCount: member._count.walksCreated,
    attendanceCount,
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

  try {
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
  } catch (err) {
    // An invalid/stale walkId (e.g. the walk was deleted between loading
    // the form and submitting it) fails the foreign key here rather than
    // earlier, since it's optional and not re-checked above.
    return logActionError("addAccidentReport", err, "Could not save that report. Try again.");
  }

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
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("updateAccidentReport", err);
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
  } catch (err) {
    if (!isPrismaCode(err, "P2025")) logActionError("deleteAccidentReport", err);
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
  revalidateTag(NOTICES_CACHE_TAG);
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

export async function resetSiteToDefault(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isResetConfirmWord(String(formData.get("confirm") ?? ""))) {
    return { ok: false, error: "Type delete to confirm, then try again." };
  }

  const limited = checkRateLimit(`${admin.id}:resetSiteToDefault`, 3, 10 * 60_000);
  if (!limited.ok) return { ok: false, error: "Try again in a few minutes." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.accidentReport.deleteMany();
      await tx.walk.deleteMany();
      await tx.siteNotice.deleteMany();
      await tx.siteNoticeCategory.deleteMany();
      await tx.siteNoticeCategory.create({
        data: {
          id: "noticecat_general",
          slug: "general",
          label: "General",
          sortOrder: 0,
        },
      });
      await tx.siteNotice.create({
        data: {
          id: DEFAULT_WELCOME_NOTICE.id,
          title: DEFAULT_WELCOME_NOTICE.title,
          body: DEFAULT_WELCOME_NOTICE.body,
          kind: "BELL",
          audience: "MEMBERS",
          slug: null,
          pageBody: null,
          categoryId: null,
          systemKey: WELCOME_NOTICE_SYSTEM_KEY,
          enabled: true,
        },
      });
      await tx.homepageFaq.deleteMany();
      await tx.homepageFaqCategory.deleteMany();
      await tx.homepageSlide.deleteMany();
      await tx.homepageTestimonial.deleteMany();
      await tx.user.deleteMany({ where: { id: { not: admin.id } } });
      await tx.siteSetting.upsert({
        where: { id: SITE_SETTING_ID },
        create: {
          id: SITE_SETTING_ID,
          primaryColor: DEFAULT_PRIMARY_COLOR,
          carouselEnabled: true,
          scrollToTopEnabled: true,
          cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
          siteName: DEFAULT_SITE_NAME,
          siteTagline: DEFAULT_SITE_TAGLINE,
          facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
          testimonialsEnabled: true,
          testimonialsSectionTitle: DEFAULT_TESTIMONIALS_SECTION_TITLE,
          testimonialsSectionIntro: DEFAULT_TESTIMONIALS_SECTION_INTRO,
          faqsEnabled: true,
          faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
          faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
          howThisStartedEnabled: true,
          howThisStartedTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
          howThisStartedEyebrow: DEFAULT_HOW_THIS_STARTED_EYEBROW,
          howThisStartedTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
          howThisStartedBody: DEFAULT_HOW_THIS_STARTED_BODY,
          aboutGoals: DEFAULT_ABOUT_GOALS_TEXT,
          aboutPlaces: DEFAULT_ABOUT_PLACES_TEXT,
          aboutExpect: DEFAULT_ABOUT_EXPECT_TEXT,
          aboutRules: DEFAULT_ABOUT_RULES_TEXT,
          homepageSectionOrder: DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT,
          memberNoticesEnabled: true,
          howWalksWorkEnabled: true,
          monthlyClockInGoal: null,
        },
        update: {
          primaryColor: DEFAULT_PRIMARY_COLOR,
          carouselEnabled: true,
          scrollToTopEnabled: true,
          cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
          siteName: DEFAULT_SITE_NAME,
          siteTagline: DEFAULT_SITE_TAGLINE,
          facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
          testimonialsEnabled: true,
          testimonialsSectionTitle: DEFAULT_TESTIMONIALS_SECTION_TITLE,
          testimonialsSectionIntro: DEFAULT_TESTIMONIALS_SECTION_INTRO,
          faqsEnabled: true,
          faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
          faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
          howThisStartedEnabled: true,
          howThisStartedTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
          howThisStartedEyebrow: DEFAULT_HOW_THIS_STARTED_EYEBROW,
          howThisStartedTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
          howThisStartedBody: DEFAULT_HOW_THIS_STARTED_BODY,
          aboutGoals: DEFAULT_ABOUT_GOALS_TEXT,
          aboutPlaces: DEFAULT_ABOUT_PLACES_TEXT,
          aboutExpect: DEFAULT_ABOUT_EXPECT_TEXT,
          aboutRules: DEFAULT_ABOUT_RULES_TEXT,
          homepageSectionOrder: DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT,
          memberNoticesEnabled: true,
          howWalksWorkEnabled: true,
          monthlyClockInGoal: null,
        },
      });
      await tx.homepageFaqCategory.createMany({
        data: DEFAULT_FAQ_CATEGORIES.map((category) => ({
          id: category.id,
          slug: category.slug,
          label: category.label,
          sortOrder: category.sortOrder,
        })),
      });
      await tx.homepageFaq.createMany({
        data: DEFAULT_FAQS.map((faq) => ({
          id: faq.id,
          sortOrder: faq.sortOrder,
          categoryId: faq.categoryId,
          question: faq.question,
          answer: faq.answer,
        })),
      });
      await tx.homepageSlide.create({
        data: {
          id: DEFAULT_HERO_SLIDE.id,
          sortOrder: DEFAULT_HERO_SLIDE.sortOrder,
          alt: DEFAULT_HERO_SLIDE.alt,
          imagePath: DEFAULT_HERO_SLIDE.imagePath,
        },
      });
      await tx.homepageTestimonial.createMany({
        data: DEFAULT_TESTIMONIALS.map((row) => ({
          id: row.id,
          sortOrder: row.sortOrder,
          name: row.name,
          role: row.role,
          quote: row.quote,
        })),
      });
    });
  } catch (err) {
    return logActionError("resetSiteToDefault", err, "Could not reset the site. Try again.");
  }

  // List Clerk after the DB wipe so anyone who signed up during the wipe is
  // still revoked — do not trust a pre-transaction snapshot (TOCTOU).
  const clerk = await clerkClient();
  let clerkFailed = 0;
  try {
    let offset = 0;
    for (;;) {
      const page = await clerk.users.getUserList({ limit: 100, offset });
      if (page.data.length === 0) break;
      for (const clerkUser of page.data) {
        if (clerkUser.id === admin.clerkId) continue;
        try {
          await clerk.users.deleteUser(clerkUser.id);
        } catch (err) {
          if (!isNotFoundStatus(err)) {
            clerkFailed += 1;
            console.error("resetSiteToDefault: Clerk login removal failed", err);
          }
        }
      }
      if (page.data.length < 100) break;
      offset += page.data.length;
    }
  } catch (err) {
    clerkFailed += 1;
    console.error("resetSiteToDefault: Clerk user list failed", err);
  }

  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidateTag(NOTICES_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/history");

  if (clerkFailed > 0) {
    return {
      ok: true,
      message:
        "The site is reset. You are still the organiser. Some old sign-ins could not be revoked automatically — remove them from Clerk if needed.",
    };
  }

  return {
    ok: true,
    message: "The site is reset to the starter homepage. You are still the organiser. Everyone else will need to join again.",
  };
}
