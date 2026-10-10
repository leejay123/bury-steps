"use server";

import { z } from "zod";
import { guardForm } from "@/lib/safe-action";

import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { CONTACT_MESSAGES_OWNER_TAG } from "@/lib/contact-messages-owner";
import { clerkClient } from "@clerk/nextjs/server";
import { syncClerkRoleFor } from "@/lib/clerk-role";
import { requireAdmin, displayName, getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withMemberPhotos } from "@/lib/member-photos";
import { loadMembersPage } from "@/lib/members-search";
import { checkRateLimit } from "@/lib/rate-limit";
import { COUNT_LIMIT_LOCK_KEYS } from "@/lib/count-limit-locks";
import { SITE_SETTING_ID } from "@/lib/theme";
import { isOwner, actorStillOwner } from "@/lib/site-owner";
import { safeAppPath } from "@/lib/urls";
import {
  makeOrganiserInviteToken,
  organiserInviteExpiresAt,
} from "@/lib/organiser-invite";
import { ORGANISER_PERMISSIONS, walksLandingPath } from "@/lib/organiser-permissions";
import {
  sendAccountDeletedEmail,
  sendAdminPromotedEmail,
  sendAdminDemotedEmail,
  sendOrganiserInviteEmail,
} from "@/lib/email/mailer";
import { syncContactUnsubscribed } from "@/lib/email/resend-audience";
import {
  type ActionResult,
  LimitReachedError,
  isNotFoundStatus,
  logActionError,
  ownerDenied,
  withCountLimitLock,
} from "./shared";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  /** Their own profile photo from Clerk, or null (initials show). */
  imageUrl: string | null;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  attendanceCount: number;
  walkCount: number;
  /** Set only while role is still MEMBER and an organiser invite is
   * outstanding — see setMemberRole/acceptOrganiserInvite. */
  pendingInvite: { sentAt: string; expiresAt: string; expired: boolean } | null;
  /** One of the site's owners (see src/lib/site-owner.ts) — only owners
   * can promote/demote an organiser, manage owner access, or remove an
   * account. Organiser capabilities are fixed profiles, not edited per
   * person. */
  isOwner: boolean;
  /** A plain member who has never clocked in, or an organiser invite that's
   * expired — the two things on this list most worth an organiser's notice.
   * Powers the "Needs attention" filter, and a small marker shown on the row
   * regardless of whether that filter is on. */
  needsAttention: boolean;
};

export type MemberRoleFilter = "all" | "ADMIN" | "MEMBER";

export type MemberSort = "oldest" | "newest" | "name" | "clockins";

/** How many matching people are in each heading's group across every page,
 * not just the rows on this one. */
export type MemberGroupTotals = { OWNER: number; ADMIN: number; MEMBER: number };

/**
 * Server-side search + pagination for the admin Members page (see
 * loadMembersPage), for the browser to call as the search box changes.
 */
export async function searchMembers(params: {
  page?: number;
  query?: string;
  role?: MemberRoleFilter;
  sort?: MemberSort;
  /** Only members needing a look — see MemberRow.needsAttention. */
  needsAttention?: boolean;
}): Promise<{ rows: MemberRow[]; total: number; groupTotals: MemberGroupTotals }> {
  const admin = await requireAdmin();
  if (!admin.permMembersView) return { rows: [], total: 0, groupTotals: { OWNER: 0, ADMIN: 0, MEMBER: 0 } };
  return loadMembersPage(params);
}

async function deleteMemberWork(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
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

  // Removing a member's account — organiser or plain member — is
  // permanent and irreversible, so it stays owner-only — organisers can't
  // delete or remove anything. The owner can never target themselves here
  // anyway (the self-delete check above already blocks that), so there's
  // no separate "can't delete the owner" case to handle.
  if (!(await isOwner(admin.id))) {
    return ownerDenied(
      target.role === "ADMIN" ? "remove an organiser's account" : "remove a member's account",
    );
  }

  // Do the database side first. It is transactional and fully reversible on
  // failure, unlike removing their Clerk login below — if this fails, we
  // want to bail out having changed nothing rather than leave someone with
  // a dead login but a database row that still says they're a member.
  // Last-organiser check is inside the same advisory lock as demote so two
  // concurrent deletes cannot leave the group with zero admins.
  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastAdmin, async (tx) => {
      // Same order as removeOwner / transferOwnership — lastAdmin then
      // lastOwner — so concurrent owner+admin deletes cannot deadlock or
      // wipe the last owner while another organiser still exists.
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${COUNT_LIMIT_LOCK_KEYS.lastOwner})`);
      if (!(await actorStillOwner(admin.id, tx))) throw new Error("NOT_OWNER");
      const fresh = await tx.user.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isOwner: true,
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
      if (fresh.isOwner) {
        const ownerCount = await tx.user.count({ where: { isOwner: true } });
        if (ownerCount <= 1) {
          throw new LimitReachedError("You cannot delete the group's last owner.");
        }
      }
      if (fresh._count.walksCreated > 0) {
        await tx.walk.updateMany({
          where: { createdById: fresh.id },
          data: { createdById: admin.id },
        });
      }
      // Accident reports are a record, so they keep this person's name. Being
      // tagged on one goes with the account, so the name is written into
      // "Who was involved" first; a report they recorded has to belong to
      // someone, so it moves to you with a note saying who recorded it.
      const name = displayName(fresh);
      const tagged = await tx.accidentReportMember.findMany({
        where: { userId: fresh.id },
        select: { report: { select: { id: true, whoInvolved: true } } },
      });
      for (const { report } of tagged) {
        await tx.accidentReport.update({
          where: { id: report.id },
          data: { whoInvolved: [report.whoInvolved.trim(), name].filter(Boolean).join(", ") },
        });
      }
      if (fresh._count.accidentReports > 0) {
        const recorded = await tx.accidentReport.findMany({
          where: { createdById: fresh.id },
          select: { id: true, organiserNotes: true },
        });
        const note = `Recorded by ${name}, whose account has since been removed.`;
        for (const report of recorded) {
          const notes = report.organiserNotes?.trim();
          await tx.accidentReport.update({
            where: { id: report.id },
            data: { createdById: admin.id, organiserNotes: notes ? `${notes}\n\n${note}` : note },
          });
        }
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
    if (err instanceof Error && err.message === "NOT_OWNER") {
      return ownerDenied(
        target.role === "ADMIN" ? "remove an organiser's account" : "remove a member's account",
      );
    }
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
  // Drop them from the Resend newsletter segment too — campaigns broadcast
  // to that audience, not only to live User rows.
  await syncContactUnsubscribed(target.email).catch((err) => {
    console.error("deleteMember: failed to remove from newsletter audience", err);
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
      revalidatePath("/admin/walks");
      revalidatePath("/admin/members");
      revalidatePath("/admin/messages");
      revalidateTag(CONTACT_MESSAGES_OWNER_TAG, { expire: 0 });
      revalidatePath("/admin/settings");
      revalidatePath("/walks");
      return {
        ok: true,
        message: `${displayName(target)} has been removed from the group, but their sign-in could not be revoked automatically — remove it from Clerk if needed.`,
        ...(href ? { href } : {}),
      };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/walks");
  revalidatePath("/admin/members");
  // contactMessagesOwnerId SetNulls on delete — refresh messages + settings
  // so a stale "messages go to …" label does not linger.
  revalidatePath("/admin/messages");
  revalidateTag(CONTACT_MESSAGES_OWNER_TAG, { expire: 0 });
  revalidatePath("/admin/settings");
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
async function setMemberRoleWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Promoting or demoting an organiser is one of the owner-only actions
  // (see src/lib/site-owner.ts) — regardless of what permissions the
  // acting organiser otherwise holds.
  if (!(await isOwner(admin.id))) return ownerDenied("change an organiser's role");
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

  // Owner access travels with organiser status — demoting one of the
  // group's owners to a plain member without them giving up owner access
  // first would leave a MEMBER row still holding it. Remove their owner
  // access (or, if they're the last owner, hand it to someone else first)
  // before demoting them.
  if (role === "MEMBER" && target.isOwner) {
    return {
      ok: false,
      error: "Remove their owner access before making them a member.",
    };
  }
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
      if (!(await actorStillOwner(admin.id))) {
        return ownerDenied("change an organiser's role");
      }
      return sendOrganiserInvite(target);
    }
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastAdmin, async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${COUNT_LIMIT_LOCK_KEYS.lastOwner})`);
      if (!(await actorStillOwner(admin.id, tx))) throw new Error("NOT_OWNER");
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
        // A direct role change supersedes any organiser invite still in
        // flight (e.g. sent while invites were required, then promoted
        // instantly after the setting was turned off). Left in place, an
        // unexpired token would let someone later demoted accept it and
        // promote themselves straight back.
        data: {
          role,
          organiserInviteToken: null,
          organiserInviteSentAt: null,
          organiserInviteExpiresAt: null,
        },
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
    if (err instanceof Error && err.message === "NOT_OWNER") {
      return ownerDenied("change an organiser's role");
    }
    if (err instanceof Error && err.message === "MEMBER_GONE") {
      return { ok: false, error: "That member is no longer in the group." };
    }
    return logActionError("setMemberRole", err, "Could not change their role. Try again.");
  }

  // Their sign-in token carries their access too (see clerk-role.ts); read
  // back from the database, since an invite leaves them a member for now.
  await syncClerkRoleFor([target.id]);

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
  // Made a member again: no longer the one alerted about messages.
  revalidateTag(CONTACT_MESSAGES_OWNER_TAG, { expire: 0 });
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
 * A full handover: gives an existing organiser owner access (see
 * src/lib/site-owner.ts) and gives up the acting owner's own in the same
 * step. Owner-only, and only to someone already an organiser (promote
 * them first if they aren't one yet). For adding a co-owner without giving
 * up your own access, see addOwner below instead.
 */
async function transferOwnershipWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(await isOwner(admin.id))) return ownerDenied("transfer ownership");
  const limited = checkRateLimit(`${admin.id}:transferOwnership`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No organiser selected." };
  if (id === admin.id) return { ok: false, error: "You are already the owner." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "ADMIN") {
    return { ok: false, error: "Choose an existing organiser to hand ownership to." };
  }

  // A generic "type Confirm" is fine for a routine, reversible change, but
  // handing over ultimate control warrants something more deliberate and
  // self-documenting: typing the specific person's name they're about to
  // make owner. Never trust the client-side check alone (matches
  // isResetConfirmWord's dual validation for the site-reset action).
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== displayName(target).trim().toLowerCase()) {
    return { ok: false, error: `Type ${displayName(target)}'s name to transfer ownership.` };
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastOwner, async (tx) => {
      if (!(await actorStillOwner(admin.id, tx))) throw new Error("NOT_OWNER");
      const fresh = await tx.user.findUnique({
        where: { id: target.id },
        select: { id: true, role: true },
      });
      if (!fresh || fresh.role !== "ADMIN") throw new Error("NOT_ADMIN");
      await tx.user.update({ where: { id: fresh.id }, data: { isOwner: true } });
      await tx.user.update({ where: { id: admin.id }, data: { isOwner: false } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_OWNER") {
      return ownerDenied("transfer ownership");
    }
    if (err instanceof Error && err.message === "NOT_ADMIN") {
      return { ok: false, error: "Choose an existing organiser to hand ownership to." };
    }
    return logActionError("transferOwnership", err, "Could not transfer ownership. Try again.");
  }

  // Their sign-in tokens carry who is an owner too (see clerk-role.ts).
  await syncClerkRoleFor([target.id, admin.id]);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath(`/admin/members/${admin.id}`);
  // Layout nav (Members / Messages / Settings) depends on owner status.
  revalidatePath("/", "layout");

  return { ok: true, message: `${displayName(target)} is now the site owner.` };
}

/**
 * Grants an existing organiser owner access without giving up the acting
 * owner's own — the group can have more than one owner at once (see
 * src/lib/site-owner.ts), unlike transferOwnership above, which is a full
 * handover. Owner-only, and only to someone already an organiser.
 */
async function addOwnerWork(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(await isOwner(admin.id))) return ownerDenied("add another owner");
  const limited = checkRateLimit(`${admin.id}:addOwner`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No organiser selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "ADMIN") {
    return { ok: false, error: "Choose an existing organiser to make a co-owner." };
  }
  if (target.isOwner) {
    return { ok: true, message: `${displayName(target)} is already an owner.` };
  }

  // Same weight as transferOwnership's own confirm — granting full access
  // deserves the same deliberate, self-documenting step either way.
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== displayName(target).trim().toLowerCase()) {
    return { ok: false, error: `Type ${displayName(target)}'s name to add them as an owner.` };
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastOwner, async (tx) => {
      if (!(await actorStillOwner(admin.id, tx))) throw new Error("NOT_OWNER");
      const fresh = await tx.user.findUnique({
        where: { id: target.id },
        select: { id: true, role: true, isOwner: true },
      });
      if (!fresh || fresh.role !== "ADMIN") throw new Error("NOT_ADMIN");
      if (fresh.isOwner) return;
      await tx.user.update({ where: { id: fresh.id }, data: { isOwner: true } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_OWNER") {
      return ownerDenied("add another owner");
    }
    if (err instanceof Error && err.message === "NOT_ADMIN") {
      return { ok: false, error: "Choose an existing organiser to make a co-owner." };
    }
    return logActionError("addOwner", err, "Could not add them as an owner. Try again.");
  }

  // Their sign-in tokens carry who is an owner too (see clerk-role.ts).
  await syncClerkRoleFor([target.id]);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath("/", "layout");

  return { ok: true, message: `${displayName(target)} is now also a site owner.` };
}

/**
 * Strips owner access from one of the group's owners, leaving them a
 * regular organiser — refused if they are the group's last remaining
 * owner (see src/lib/site-owner.ts's ownerCount; at least one must always
 * remain). Owner-only, same as every other action here.
 */
async function removeOwnerWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(await isOwner(admin.id))) return ownerDenied("remove another owner");
  const limited = checkRateLimit(`${admin.id}:removeOwner`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No organiser selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (!target.isOwner) {
    return { ok: true, message: `${displayName(target)} is not an owner.` };
  }

  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== "confirm") {
    return { ok: false, error: "Type Confirm to remove their owner access." };
  }

  try {
    await withCountLimitLock(COUNT_LIMIT_LOCK_KEYS.lastOwner, async (tx) => {
      if (!(await actorStillOwner(admin.id, tx))) throw new Error("NOT_OWNER");
      const fresh = await tx.user.findUnique({ where: { id: target.id } });
      if (!fresh) throw new Error("MEMBER_GONE");
      if (!fresh.isOwner) return;
      const remaining = await tx.user.count({ where: { isOwner: true } });
      if (remaining <= 1) {
        throw new LimitReachedError("You cannot remove the group's last owner.");
      }
      await tx.user.update({ where: { id: fresh.id }, data: { isOwner: false } });
    });
  } catch (err) {
    if (err instanceof LimitReachedError) return { ok: false, error: err.message };
    if (err instanceof Error && err.message === "NOT_OWNER") {
      return ownerDenied("remove another owner");
    }
    if (err instanceof Error && err.message === "MEMBER_GONE") {
      return { ok: false, error: "That member is no longer in the group." };
    }
    return logActionError("removeOwner", err, "Could not remove their owner access. Try again.");
  }

  // Their sign-in tokens carry who is an owner too (see clerk-role.ts).
  await syncClerkRoleFor([target.id]);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath("/", "layout");

  return { ok: true, message: `${displayName(target)} is no longer a site owner.` };
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
    // Only a still-MEMBER row can hold an invite — a concurrent accept or
    // direct promote must not be overwritten with a fresh unused token.
    const claimed = await prisma.user.updateMany({
      where: { id: target.id, role: "MEMBER" },
      data: {
        organiserInviteToken: token,
        organiserInviteSentAt: new Date(),
        organiserInviteExpiresAt: expiresAt,
      },
    });
    if (claimed.count !== 1) {
      return {
        ok: false,
        error: "That member is no longer eligible for an organiser invite.",
      };
    }
  } catch (err) {
    return logActionError("setMemberRole", err, "Could not send the invite. Try again.");
  }

  // Best-effort — the invite is already recorded and visible in the members
  // list either way (as "Invited"), so a failed send here doesn't need to
  // block the admin; they can hit Resend. Every organiser has the same
  // fixed set of capabilities, so the email always describes the same
  // thing.
  await sendOrganiserInviteEmail(target, token, ORGANISER_PERMISSIONS).catch((err) => {
    console.error("setMemberRole: failed to send organiser invite email", err);
  });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);

  return {
    ok: true,
    message: `Invite sent to ${displayName(target)}. They'll become an organiser once they accept it.`,
  };
}

async function resendOrganiserInviteWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Inviting/promoting a new organiser is owner-only — resending an
  // invite is part of that same flow.
  if (!(await isOwner(admin.id))) return ownerDenied("resend an organiser invite");
  const limited = checkRateLimit(`${admin.id}:resendOrganiserInvite`, 5, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }
  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "MEMBER" || !target.organiserInviteToken) {
    return { ok: false, error: "There is no pending invite for this person." };
  }
  if (!(await actorStillOwner(admin.id))) return ownerDenied("resend an organiser invite");

  return sendOrganiserInvite(target);
}

async function cancelOrganiserInviteWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Same as resendOrganiserInvite — owner-only.
  if (!(await isOwner(admin.id))) return ownerDenied("cancel an organiser invite");
  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, error: "No member selected." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "MEMBER" || !target.organiserInviteToken) {
    return { ok: false, error: "There is no pending invite for this person." };
  }
  if (!(await actorStillOwner(admin.id))) return ownerDenied("cancel an organiser invite");

  try {
    // Claim-clear: if they already accepted (or another cancel won), count
    // is 0 — do not report success for a token that was already consumed.
    const cleared = await prisma.user.updateMany({
      where: { id, role: "MEMBER", organiserInviteToken: { not: null } },
      data: {
        organiserInviteToken: null,
        organiserInviteSentAt: null,
        organiserInviteExpiresAt: null,
      },
    });
    if (cleared.count !== 1) {
      return { ok: false, error: "There is no pending invite for this person." };
    }
  } catch (err) {
    return logActionError("cancelOrganiserInvite", err, "Could not cancel the invite. Try again.");
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true, message: `Invite for ${displayName(target)} cancelled.` };
}

/**
 * Reached from the emailed invite link. The page is public so expired /
 * invalid tokens can explain themselves without forcing sign-in, but
 * accepting requires the invitee to be signed in as themselves (see
 * organiser-invite/[token]/page.tsx). The unguessable token mailed only to
 * their address is still the capability that authorises the promotion —
 * the session bind stops someone else with the link accepting on the
 * wrong account. Actually grants organiser access — the whole point of
 * the "require accepted invite" setting is that this is the one and only
 * place role flips to ADMIN while it's on.
 */
async function acceptOrganiserInviteWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "This invite link is invalid." };

  const limited = checkRateLimit(`acceptOrganiserInvite:${token}`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

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
    // Only the request that clears the invite token wins — a double Accept
    // must not promote twice or send two "you're an organiser" emails.
    const accepted = await prisma.user.updateMany({
      where: {
        id: target.id,
        role: "MEMBER",
        organiserInviteToken: token,
      },
      data: {
        role: "ADMIN",
        organiserInviteToken: null,
        organiserInviteSentAt: null,
        organiserInviteExpiresAt: null,
      },
    });
    if (accepted.count === 0) {
      return { ok: false, error: "This invite link is invalid or has already been used." };
    }
  } catch (err) {
    return logActionError("acceptOrganiserInvite", err, "Could not accept the invite. Try again.");
  }

  // Their sign-in token carries their access too (see clerk-role.ts).
  await syncClerkRoleFor([target.id]);

  await sendAdminPromotedEmail(target).catch((err) => {
    console.error("acceptOrganiserInvite: failed to send admin-promoted confirmation email", err);
  });

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${target.id}`);
  revalidatePath("/walks");
  // Layout nav (Members / Reports / Settings) depends on role for this person.
  revalidatePath("/", "layout");

  // Every organiser has permWalksView, so this always lands on the admin
  // dashboard (see walksLandingPath).
  return {
    ok: true,
    message: "You're now an organiser.",
    href: walksLandingPath(ORGANISER_PERMISSIONS),
  };
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
  /** Their own profile photo from Clerk, or null (initials show). */
  imageUrl: string | null;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  walkCount: number;
  /** The real total, independent of how many `items` were actually fetched. */
  attendanceCount: number;
  isYou: boolean;
  items: MemberHistoryItem[];
  pendingInvite: { sentAt: string; expiresAt: string; expired: boolean } | null;
  /** One of the group's owners (see src/lib/site-owner.ts) — there can be
   * more than one. */
  isOwner: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
} | null> {
  const admin = await requireAdmin();
  if (!admin.permMembersView) return null;
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
  const photos = await withMemberPhotos([member]);

  return {
    name: displayName(member),
    email: member.email,
    imageUrl: photos.get(member.id) ?? null,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
    walkCount: member._count.walksCreated,
    attendanceCount,
    isYou: member.id === admin.id,
    isOwner: member.isOwner,
    emergencyContactName: member.emergencyContactName,
    emergencyContactPhone: member.emergencyContactPhone,
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
      endedAt: attendance.walk.endedAt?.toISOString() ?? null,
      cancelledAt: attendance.walk.cancelledAt?.toISOString() ?? null,
      clockedInAt: attendance.clockedInAt.toISOString(),
      clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
      clockedOutReason: attendance.clockedOutReason,
    })),
  };
}

const memberIdSchema = z.object({
  userId: z.string().min(1, "No member selected."),
});

function readMemberId(formData: FormData) {
  return { userId: String(formData.get("userId") ?? "") };
}

const organiserIdSchema = z.object({
  userId: z.string().min(1, "No organiser selected."),
});

const inviteTokenSchema = z.object({
  token: z.string().min(1, "This invite link is invalid."),
});

export const deleteMember = guardForm("organiser", memberIdSchema, readMemberId, deleteMemberWork);
export const setMemberRole = guardForm("organiser", memberIdSchema, readMemberId, setMemberRoleWork);
export const transferOwnership = guardForm("organiser", organiserIdSchema, readMemberId, transferOwnershipWork);
export const addOwner = guardForm("organiser", organiserIdSchema, readMemberId, addOwnerWork);
export const removeOwner = guardForm("organiser", organiserIdSchema, readMemberId, removeOwnerWork);
export const resendOrganiserInvite = guardForm(
  "organiser",
  memberIdSchema,
  readMemberId,
  resendOrganiserInviteWork,
);
export const cancelOrganiserInvite = guardForm(
  "organiser",
  memberIdSchema,
  readMemberId,
  cancelOrganiserInviteWork,
);
export const acceptOrganiserInvite = guardForm(
  "public",
  inviteTokenSchema,
  (formData) => ({ token: String(formData.get("token") ?? "") }),
  acceptOrganiserInviteWork,
);
