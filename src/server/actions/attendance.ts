"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser, displayName } from "@/lib/auth";
import {
  canOrganiserAddAttendance,
  organiserRecordedClockInAt,
  windowState,
} from "@/lib/walk-window";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  type ActionResult,
  LimitReachedError,
  isPrismaCode,
  logActionError,
  revalidateWalkShare,
} from "./shared";

/** How long health information is kept after the walk, in days. */
const CONDITIONS_RETENTION_DAYS = 90;

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
