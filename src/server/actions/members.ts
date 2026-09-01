"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import { safeAppPath } from "@/lib/urls";
import {
  type ActionResult,
  LimitReachedError,
  isNotFoundStatus,
  logActionError,
  withCountLimitLock,
} from "./shared";

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
