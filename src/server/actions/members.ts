"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin, displayName, getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { SITE_SETTING_ID } from "@/lib/theme";
import { safeAppPath } from "@/lib/urls";
import {
  makeOrganiserInviteToken,
  organiserInviteExpiresAt,
} from "@/lib/organiser-invite";
import {
  sendAccountDeletedEmail,
  sendAdminPromotedEmail,
  sendAdminDemotedEmail,
  sendOrganiserInviteEmail,
} from "@/lib/email/mailer";
import {
  type ActionResult,
  LimitReachedError,
  isNotFoundStatus,
  logActionError,
  withCountLimitLock,
} from "./shared";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  attendanceCount: number;
  walkCount: number;
  /** Set only while role is still MEMBER and an organiser invite is
   * outstanding — see setMemberRole/acceptOrganiserInvite. */
  pendingInvite: { sentAt: string; expiresAt: string; expired: boolean } | null;
};

export type MemberRoleFilter = "all" | "ADMIN" | "MEMBER";

/**
 * Server-side search + pagination for the admin Members page. Matching and
 * paging both happen in Postgres (not on a fixed-size fetch filtered in the
 * browser), so the page stays correct — and fast, once the trigram index
 * from the 20260909140000_member_search_trgm migration is in place — at any
 * membership size, not just up to some fetch cap. Search text never reaches
 * the URL: the client calls this action directly instead of navigating.
 */
export async function searchMembers({
  page = 1,
  query = "",
  role = "all",
}: {
  page?: number;
  query?: string;
  role?: MemberRoleFilter;
}): Promise<{ rows: MemberRow[]; total: number }> {
  await requireAdmin();

  const needle = query.trim();
  let searchWhere: Prisma.UserWhereInput | undefined;
  if (needle) {
    const textMatch: Prisma.UserWhereInput = {
      OR: [
        { email: { contains: needle, mode: "insensitive" } },
        { firstName: { contains: needle, mode: "insensitive" } },
        { lastName: { contains: needle, mode: "insensitive" } },
      ],
    };
    // Same "type a role name to filter by it" shortcut the old client-side
    // search had — typing "adm"/"organiser"/"member" also matches by role.
    const lower = needle.toLowerCase();
    const roleMatches: Prisma.UserWhereInput["role"][] = [];
    if (lower.length >= 3) {
      if ("organiser".startsWith(lower) || "admin".startsWith(lower)) roleMatches.push("ADMIN");
      if ("member".startsWith(lower)) roleMatches.push("MEMBER");
    }
    searchWhere =
      roleMatches.length > 0
        ? { OR: [textMatch, ...roleMatches.map((r) => ({ role: r }))] }
        : textMatch;
  }

  const where: Prisma.UserWhereInput = {
    ...(role !== "all" ? { role } : {}),
    ...(searchWhere ? { AND: [searchWhere] } : {}),
  };

  const skip = (Math.max(1, page) - 1) * LIST_PAGE_SIZE;

  const [total, members] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      // id as a tiebreaker keeps pages stable even when rows share a
      // createdAt millisecond.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip,
      take: LIST_PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        organiserInviteSentAt: true,
        organiserInviteExpiresAt: true,
        _count: { select: { attendances: true, walksCreated: true } },
      },
    }),
  ]);

  const now = Date.now();
  return {
    total,
    rows: members.map((member) => ({
      id: member.id,
      name: displayName(member),
      email: member.email,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      attendanceCount: member._count.attendances,
      walkCount: member._count.walksCreated,
      pendingInvite: member.organiserInviteSentAt
        ? {
            sentAt: member.organiserInviteSentAt.toISOString(),
            expiresAt: (member.organiserInviteExpiresAt ?? member.organiserInviteSentAt).toISOString(),
            expired: (member.organiserInviteExpiresAt?.getTime() ?? 0) < now,
          }
        : null,
    })),
  };
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

  // Best-effort, and deliberately after the point of no return above — they
  // are gone from the group either way, whether or not this email sends or
  // the Clerk removal below succeeds.
  await sendAccountDeletedEmail(target).catch((err) => {
    console.error("deleteMember: failed to send deletion confirmation email", err);
  });

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

  // Promoting, with the "must accept an emailed invite first" setting on:
  // send the invite instead of promoting immediately. Role stays MEMBER
  // until they accept — see acceptOrganiserInvite.
  if (role === "ADMIN") {
    const setting = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { organiserInviteRequired: true },
    });
    if (setting?.organiserInviteRequired) {
      return sendOrganiserInvite(target);
    }
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
      // Demoting the designated contact-messages owner would otherwise
      // leave that setting silently pointing at a plain member — the FK's
      // onDelete: SetNull only helps if they're removed outright, not
      // demoted.
      if (role === "MEMBER") {
        await tx.siteSetting.updateMany({
          where: { id: SITE_SETTING_ID, contactMessagesOwnerId: fresh.id },
          data: { contactMessagesOwnerId: null },
        });
      }
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "MEMBER_GONE") {
      return { ok: false, error: "That member is no longer in the group." };
    }
    return logActionError("setMemberRole", err, "Could not change their role. Try again.");
  }

  if (role === "ADMIN") {
    await sendAdminPromotedEmail(target).catch((err) => {
      console.error("setMemberRole: failed to send admin-promoted email", err);
    });
  } else {
    await sendAdminDemotedEmail(target).catch((err) => {
      console.error("setMemberRole: failed to send admin-demoted email", err);
    });
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

/** Issues (or reissues) an organiser invite — shared by setMemberRole's
 * promote branch and resendOrganiserInvite. Role stays MEMBER; only
 * acceptOrganiserInvite ever flips it to ADMIN. */
async function sendOrganiserInvite(target: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): Promise<ActionResult> {
  const token = makeOrganiserInviteToken();
  const expiresAt = organiserInviteExpiresAt();

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        organiserInviteToken: token,
        organiserInviteSentAt: new Date(),
        organiserInviteExpiresAt: expiresAt,
      },
    });
  } catch (err) {
    return logActionError("setMemberRole", err, "Could not send the invite. Try again.");
  }

  // Best-effort — the invite is already recorded and visible in the members
  // list either way (as "Invited"), so a failed send here doesn't need to
  // block the admin; they can hit Resend.
  await sendOrganiserInviteEmail(target, token).catch((err) => {
    console.error("setMemberRole: failed to send organiser invite email", err);
  });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);

  return {
    ok: true,
    message: `Invite sent to ${displayName(target)}. They'll become an organiser once they accept it.`,
  };
}

export async function resendOrganiserInvite(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "MEMBER" || !target.organiserInviteToken) {
    return { ok: false, error: "There is no pending invite for this person." };
  }

  return sendOrganiserInvite(target);
}

export async function cancelOrganiserInvite(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "MEMBER" || !target.organiserInviteToken) {
    return { ok: false, error: "There is no pending invite for this person." };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { organiserInviteToken: null, organiserInviteSentAt: null, organiserInviteExpiresAt: null },
    });
  } catch (err) {
    return logActionError("cancelOrganiserInvite", err, "Could not cancel the invite. Try again.");
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true, message: `Invite for ${displayName(target)} cancelled.` };
}

/**
 * Public — reached from the emailed invite link, no sign-in required (same
 * trust model as the email-preferences unsubscribe tokens: an unguessable
 * token mailed only to the invitee's own address is treated as
 * authorization on its own). Actually grants organiser access — the whole
 * point of the "require accepted invite" setting is that this is the one
 * and only place role flips to ADMIN while it's on.
 */
export async function acceptOrganiserInvite(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "This invite link is invalid." };

  const target = await prisma.user.findUnique({ where: { organiserInviteToken: token } });
  if (!target || target.role !== "MEMBER") {
    return { ok: false, error: "This invite link is invalid or has already been used." };
  }
  if (!target.organiserInviteExpiresAt || target.organiserInviteExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invite link has expired. Ask an organiser to resend it." };
  }

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        organiserInviteToken: null,
        organiserInviteSentAt: null,
        organiserInviteExpiresAt: null,
      },
    });
  } catch (err) {
    return logActionError("acceptOrganiserInvite", err, "Could not accept the invite. Try again.");
  }

  await sendAdminPromotedEmail(target).catch((err) => {
    console.error("acceptOrganiserInvite: failed to send admin-promoted confirmation email", err);
  });

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath("/dashboard");
  // Layout nav (Members / Reports / Settings) depends on role for this person.
  revalidatePath("/", "layout");

  // Only redirect straight into /admin/members if the browser that just
  // clicked the email link is already signed in as the person who was
  // invited — /admin/* 404s for anyone else (see src/proxy.ts), so
  // redirecting an unauthenticated or different-account browser there
  // would just be a confusing dead end. The accept page shows a sign-in
  // prompt itself when this is absent.
  const viewer = await getOptionalUser();
  return {
    ok: true,
    message: "You're now an organiser.",
    ...(viewer?.id === target.id ? { href: "/admin/members" } : {}),
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
  pendingInvite: { sentAt: string; expiresAt: string; expired: boolean } | null;
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
    pendingInvite: member.organiserInviteSentAt
      ? {
          sentAt: member.organiserInviteSentAt.toISOString(),
          expiresAt: (member.organiserInviteExpiresAt ?? member.organiserInviteSentAt).toISOString(),
          expired: (member.organiserInviteExpiresAt?.getTime() ?? 0) < Date.now(),
        }
      : null,
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
