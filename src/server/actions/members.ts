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
  clampGrantablePermissions,
  hasAnyPermission,
  NO_ORGANISER_PERMISSIONS,
  pickOrganiserPermissions,
  readOrganiserPermissions,
  type OrganiserPermissions,
} from "@/lib/organiser-permissions";
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
  permissionDenied,
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
  /** Meaningless while role is MEMBER — present regardless so a pending
   * invite's chosen permissions can still be shown/edited before it's
   * accepted. */
  permissions: OrganiserPermissions;
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
  const admin = await requireAdmin();
  if (!admin.permMembers) return { rows: [], total: 0 };

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
        permWalks: true,
        permMembers: true,
        permReportsMessages: true,
        permSettings: true,
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
      permissions: pickOrganiserPermissions(member),
    })),
  };
}

export async function deleteMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permMembers) return permissionDenied("permMembers");
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
      revalidatePath("/walks");
      return {
        ok: true,
        message: `${displayName(target)} has been removed from the group, but their sign-in could not be revoked automatically — remove it from Clerk if needed.`,
        ...(href ? { href } : {}),
      };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/walks");

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
  // Changing who's an organiser (or what they can do) is itself a Members
  // capability — a limited organiser who lacks it can't use this at all,
  // even by posting directly to this action.
  if (!admin.permMembers) return permissionDenied("permMembers");
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
  // Only read/applied when promoting — see below. Capped to what the
  // acting organiser can actually grant: without this, holding just the
  // Members permission would be enough to promote anyone (including a
  // fresh account they control) straight to full access, regardless of
  // what they were given themselves.
  const permissions = clampGrantablePermissions(
    admin,
    readOrganiserPermissions(formData),
    NO_ORGANISER_PERMISSIONS,
  );

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

  // The whole point of the organiser role is the extra access it grants —
  // an invite/promotion that switches nothing on would just be a member
  // with an unused ADMIN flag, so refuse it here rather than let it
  // through and rely on the invite email's "nothing was granted" fallback.
  if (role === "ADMIN" && !hasAnyPermission(permissions)) {
    return { ok: false, error: "Choose at least one permission for them to have as an organiser." };
  }

  // Promoting, with the "must accept an emailed invite first" setting on:
  // send the invite instead of promoting immediately. Role stays MEMBER
  // until they accept — see acceptOrganiserInvite. The chosen permissions
  // are written right away regardless, so they're already in place the
  // moment the invite is accepted.
  if (role === "ADMIN") {
    const setting = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { organiserInviteRequired: true },
    });
    if (setting?.organiserInviteRequired) {
      return sendOrganiserInvite(target, permissions);
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
      await tx.user.update({
        where: { id: fresh.id },
        data: role === "ADMIN" ? { role, ...permissions } : { role },
      });
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
  revalidatePath("/walks");
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

/**
 * Change what an existing organiser (or a member with a pending organiser
 * invite) can do, without touching their role — see setMemberRole for
 * picking permissions at invite time instead.
 */
export async function setOrganiserPermissions(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permMembers) return permissionDenied("permMembers");
  const limited = checkRateLimit(`${admin.id}:setOrganiserPermissions`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "ADMIN" && !target.organiserInviteToken) {
    return { ok: false, error: "This person is not an organiser and has no pending invite." };
  }

  // Capped to what the acting organiser can actually grant — anything
  // outside their own permissions stays exactly as it was on this row,
  // in either direction. Without this, holding just the Members
  // permission would be enough to hand anyone (including a fresh account
  // the organiser controls) full access, regardless of what they were
  // given themselves.
  const permissions = clampGrantablePermissions(
    admin,
    readOrganiserPermissions(formData),
    pickOrganiserPermissions(target),
  );

  // Same rule as promoting: an organiser is defined by having some
  // access, so this can't be used to leave one with none at all.
  if (!hasAnyPermission(permissions)) {
    return { ok: false, error: "Choose at least one permission — or make them a member instead." };
  }

  try {
    await prisma.user.update({ where: { id }, data: permissions });
  } catch (err) {
    return logActionError(
      "setOrganiserPermissions",
      err,
      "Could not save their permissions. Try again.",
    );
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  // Layout nav (Members / Reports / Settings) depends on this for them.
  revalidatePath("/", "layout");

  return { ok: true, message: `${displayName(target)}'s permissions have been updated.` };
}

/** Issues (or reissues) an organiser invite — shared by setMemberRole's
 * promote branch and resendOrganiserInvite. Role stays MEMBER; only
 * acceptOrganiserInvite ever flips it to ADMIN.
 *
 * `permissions` is only passed on the initial invite (from setMemberRole) —
 * a resend reuses whatever was already chosen rather than silently
 * resetting it, so omit it there. */
async function sendOrganiserInvite(
  target: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } & OrganiserPermissions,
  permissions?: OrganiserPermissions,
): Promise<ActionResult> {
  const token = makeOrganiserInviteToken();
  const expiresAt = organiserInviteExpiresAt();

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        organiserInviteToken: token,
        organiserInviteSentAt: new Date(),
        organiserInviteExpiresAt: expiresAt,
        ...permissions,
      },
    });
  } catch (err) {
    return logActionError("setMemberRole", err, "Could not send the invite. Try again.");
  }

  // Best-effort — the invite is already recorded and visible in the members
  // list either way (as "Invited"), so a failed send here doesn't need to
  // block the admin; they can hit Resend. The email lists what's actually
  // granted — the just-chosen permissions on the initial invite (`target`
  // itself still has the pre-update values at this point), or whatever's
  // already on the row for a resend.
  await sendOrganiserInviteEmail(target, token, permissions ?? pickOrganiserPermissions(target)).catch(
    (err) => {
      console.error("setMemberRole: failed to send organiser invite email", err);
    },
  );

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
  const admin = await requireAdmin();
  if (!admin.permMembers) return permissionDenied("permMembers");
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
  const admin = await requireAdmin();
  if (!admin.permMembers) return permissionDenied("permMembers");
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

  // Belt and braces: the accept page itself already redirects a signed-out
  // browser to sign in first, and never renders the Accept button at all
  // for a browser signed in as someone else — so this only ever fires on a
  // direct call that skipped the page (or a session that changed between
  // page load and the click).
  const viewer = await getOptionalUser();
  if (!viewer || viewer.id !== target.id) {
    return {
      ok: false,
      error: "This invite can only be accepted by signing in as the invited account.",
    };
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
  revalidatePath("/walks");
  // Layout nav (Members / Reports / Settings) depends on role for this person.
  revalidatePath("/", "layout");

  // The viewer-match check above guarantees this is the invitee's own
  // signed-in browser by this point, so /admin/members is always safe to
  // send them to (/admin/* 404s for anyone else — see src/proxy.ts).
  return { ok: true, message: "You're now an organiser.", href: "/admin/members" };
}

export type MemberHistoryItem = {
  id: string;
  walkId: string;
  walkTitle: string;
  location: string | null;
  durationMins: number;
  startsAt: string;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt: string | null;
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
  permissions: OrganiserPermissions;
} | null> {
  const admin = await requireAdmin();
  if (!admin.permMembers) return null;
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
                endedAt: true,
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
    permissions: pickOrganiserPermissions(member),
    items: member.attendances.map((attendance) => ({
      id: attendance.id,
      walkId: attendance.walk.id,
      walkTitle: attendance.walk.title,
      location: attendance.walk.location,
      durationMins: attendance.walk.durationMins,
      startsAt: attendance.walk.startsAt.toISOString(),
      endedAt: attendance.walk.endedAt?.toISOString() ?? null,
      cancelledAt: attendance.walk.cancelledAt?.toISOString() ?? null,
      clockedInAt: attendance.clockedInAt.toISOString(),
      clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
      clockedOutReason: attendance.clockedOutReason,
    })),
  };
}
