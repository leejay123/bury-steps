"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { londonWallClockToUtc } from "@/lib/dates";
import { canOrganiserEditJourney } from "@/lib/walk-window";
import { MAX_JOURNEY_BODY, MAX_JOURNEY_EVENTS, MAX_JOURNEY_TITLE } from "@/lib/walk-journey";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import {
  type ActionResult,
  LimitReachedError,
  logActionError,
  revalidateWalkShare,
  withCountLimitLock,
} from "./shared";

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
