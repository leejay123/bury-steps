import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const { revalidatePath, requireAdmin, getOptionalUser, checkRateLimit, deleteUser, prismaMock, transaction } =
  vi.hoisted(() => {
    const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
      user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
      walk: { updateMany: vi.fn() },
      accidentReport: { updateMany: vi.fn() },
      walkJourneyEvent: { updateMany: vi.fn() },
      attendance: { count: vi.fn() },
      siteSetting: { updateMany: vi.fn(), findUnique: vi.fn() },
    };
    const transaction = vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return (arg as (tx: unknown) => unknown)({
        $executeRawUnsafe: vi.fn(),
        ...prismaMock,
      });
    });
    return {
      revalidatePath: vi.fn(),
      requireAdmin: vi.fn(),
      getOptionalUser: vi.fn(async (): Promise<{ id: string } | null> => null),
      checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
      deleteUser: vi.fn(),
      prismaMock,
      transaction,
    };
  });

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({ users: { deleteUser } })),
}));
// Real email sending pulls in site-theme.ts (next/cache's unstable_cache,
// not mocked above) and hits the network — out of scope for these tests,
// which only care that members.ts calls the right mailer function.
vi.mock("@/lib/email/mailer", () => ({
  sendAccountDeletedEmail: vi.fn(async () => {}),
  sendAdminPromotedEmail: vi.fn(async () => {}),
  sendAdminDemotedEmail: vi.fn(async () => {}),
  sendOrganiserInviteEmail: vi.fn(async () => {}),
}));
vi.mock("@/lib/organiser-invite", () => ({
  makeOrganiserInviteToken: vi.fn(() => "invite-token-123"),
  organiserInviteExpiresAt: vi.fn((from = new Date()) => new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin, getOptionalUser };
});

import { sendOrganiserInviteEmail, sendAdminPromotedEmail } from "@/lib/email/mailer";
import {
  acceptOrganiserInvite,
  cancelOrganiserInvite,
  deleteMember,
  getMemberHistory,
  resendOrganiserInvite,
  searchMembers,
  setMemberRole,
  setOrganiserPermissions,
} from "./members";

// Full access by default so existing tests exercise the unclamped path —
// see the "clampGrantablePermissions" describe block below for a limited
// (Members-only) actor's behaviour specifically.
const ADMIN = {
  id: "admin-1",
  clerkId: "clerk-admin-1",
  permWalks: true,
  permMembers: true,
  permReportsMessages: true,
  permSettings: true,
};

function deleteMemberForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  checkRateLimit.mockReturnValue({ ok: true });
});

describe("deleteMember", () => {
  it("rejects an organiser without the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await deleteMember(null, deleteMemberForm({ userId: "member-1", confirm: "confirm" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage members." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects when no member is selected", async () => {
    const result = await deleteMember(null, deleteMemberForm({ confirm: "confirm" }));
    expect(result).toEqual({ ok: false, error: "No member selected." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("requires the confirm phrase", async () => {
    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: "member-1", confirm: "delete" }),
    );
    expect(result).toEqual({ ok: false, error: "Type Confirm to remove this member." });
  });

  it("refuses to let an admin delete their own account here", async () => {
    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: ADMIN.id, confirm: "confirm" }),
    );
    expect(result).toEqual({
      ok: false,
      error: "You cannot delete your own account from here.",
    });
  });

  it("reports the member as already gone if the lookup finds nothing", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: "member-1", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: false, error: "That member is no longer in the group." });
  });

  it("blocks deleting the group's last remaining organiser", async () => {
    const target = {
      id: "admin-2",
      clerkId: "clerk-admin-2",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
      role: "ADMIN",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target) // outer lookup
      .mockResolvedValueOnce({
        id: target.id,
        role: "ADMIN",
        _count: { walksCreated: 0, accidentReports: 0, journeyEvents: 0 },
      }); // inner lookup, inside the lock
    prismaMock.user.count.mockResolvedValueOnce(1); // only one organiser left

    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: target.id, confirm: "confirm" }),
    );

    expect(result).toEqual({ ok: false, error: "You cannot delete the last organiser." });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("allows deleting an organiser when other organisers remain", async () => {
    const target = {
      id: "admin-2",
      clerkId: "clerk-admin-2",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
      role: "ADMIN",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce({
        id: target.id,
        role: "ADMIN",
        _count: { walksCreated: 0, accidentReports: 0, journeyEvents: 0 },
      });
    prismaMock.user.count.mockResolvedValueOnce(2); // another organiser exists
    prismaMock.user.delete.mockResolvedValueOnce(target);
    deleteUser.mockResolvedValueOnce(undefined);

    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: target.id, confirm: "confirm" }),
    );

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: target.id } });
    expect(deleteUser).toHaveBeenCalledWith(target.clerkId);
    expect(result).toEqual({ ok: true, message: "Sam Lee has been removed from the group." });
  });

  it("reassigns the member's walks, reports, and journey events to the acting admin before deleting them", async () => {
    const target = {
      id: "member-1",
      clerkId: "clerk-member-1",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
      role: "MEMBER",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce({
        id: target.id,
        role: "MEMBER",
        _count: { walksCreated: 2, accidentReports: 1, journeyEvents: 3 },
      });
    prismaMock.user.delete.mockResolvedValueOnce(target);
    deleteUser.mockResolvedValueOnce(undefined);

    await deleteMember(null, deleteMemberForm({ userId: target.id, confirm: "confirm" }));

    expect(prismaMock.walk.updateMany).toHaveBeenCalledWith({
      where: { createdById: target.id },
      data: { createdById: ADMIN.id },
    });
    expect(prismaMock.accidentReport.updateMany).toHaveBeenCalledWith({
      where: { createdById: target.id },
      data: { createdById: ADMIN.id },
    });
    expect(prismaMock.walkJourneyEvent.updateMany).toHaveBeenCalledWith({
      where: { createdById: target.id },
      data: { createdById: ADMIN.id },
    });
  });

  it("skips reassignment calls entirely when the member created nothing", async () => {
    const target = {
      id: "member-1",
      clerkId: "clerk-member-1",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
      role: "MEMBER",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce({
        id: target.id,
        role: "MEMBER",
        _count: { walksCreated: 0, accidentReports: 0, journeyEvents: 0 },
      });
    prismaMock.user.delete.mockResolvedValueOnce(target);
    deleteUser.mockResolvedValueOnce(undefined);

    await deleteMember(null, deleteMemberForm({ userId: target.id, confirm: "confirm" }));

    expect(prismaMock.walk.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.accidentReport.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.walkJourneyEvent.updateMany).not.toHaveBeenCalled();
  });

  it("treats an already-gone Clerk login (404) as a clean success, not a warning", async () => {
    const target = {
      id: "member-1",
      clerkId: "clerk-member-1",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
      role: "MEMBER",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce({
        id: target.id,
        role: "MEMBER",
        _count: { walksCreated: 0, accidentReports: 0, journeyEvents: 0 },
      });
    prismaMock.user.delete.mockResolvedValueOnce(target);
    deleteUser.mockRejectedValueOnce({ status: 404 });

    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: target.id, confirm: "confirm" }),
    );

    expect(result).toEqual({ ok: true, message: "Jo has been removed from the group." });
  });

  it("still reports success but warns when the DB removal succeeded but Clerk's login removal failed for another reason", async () => {
    const target = {
      id: "member-1",
      clerkId: "clerk-member-1",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
      role: "MEMBER",
    };
    prismaMock.user.findUnique
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce({
        id: target.id,
        role: "MEMBER",
        _count: { walksCreated: 0, accidentReports: 0, journeyEvents: 0 },
      });
    prismaMock.user.delete.mockResolvedValueOnce(target);
    deleteUser.mockRejectedValueOnce(new Error("Clerk API is down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteMember(
      null,
      deleteMemberForm({ userId: target.id, confirm: "confirm" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toContain("could not be revoked automatically");
    }
  });
});

function roleForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("setMemberRole", () => {
  it("rejects when the acting admin lacks the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "ADMIN", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage members." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects when no member is selected", async () => {
    const result = await setMemberRole(null, roleForm({ role: "ADMIN", confirm: "confirm" }));
    expect(result).toEqual({ ok: false, error: "No member selected." });
  });

  it("requires the confirm phrase", async () => {
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "ADMIN", confirm: "no" }),
    );
    expect(result).toEqual({ ok: false, error: "Type confirm to change their role." });
  });

  it("rejects a role that isn't ADMIN or MEMBER", async () => {
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "SUPERUSER", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: false, error: "Choose organiser or member." });
  });

  it("reports the member as already gone if the lookup finds nothing", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "ADMIN", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: false, error: "That member is no longer in the group." });
  });

  it("short-circuits with a friendly message when the member is already at that role", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    });
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "MEMBER", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: true, message: "Jo is already a member." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("blocks demoting the group's last remaining organiser", async () => {
    const target = {
      id: "admin-2",
      role: "ADMIN",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.count.mockResolvedValueOnce(1);

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "MEMBER", confirm: "confirm" }),
    );

    expect(result).toEqual({ ok: false, error: "You cannot demote the last organiser." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("allows demoting an organiser when other organisers remain", async () => {
    const target = {
      id: "admin-2",
      role: "ADMIN",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.count.mockResolvedValueOnce(2);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "MEMBER" });

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "MEMBER", confirm: "confirm" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: { role: "MEMBER" },
    });
    expect(result).toEqual({ ok: true, message: "Sam Lee is now a member." });
  });

  it("clears them as the contact-messages owner when demoted", async () => {
    const target = {
      id: "admin-2",
      role: "ADMIN",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.count.mockResolvedValueOnce(2);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "MEMBER" });

    await setMemberRole(null, roleForm({ userId: target.id, role: "MEMBER", confirm: "confirm" }));

    expect(prismaMock.siteSetting.updateMany).toHaveBeenCalledWith({
      where: { id: "site", contactMessagesOwnerId: target.id },
      data: { contactMessagesOwnerId: null },
    });
  });

  it("does not touch the contact-messages owner when promoting", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "ADMIN" });

    await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm", permWalks: "on" }),
    );

    expect(prismaMock.siteSetting.updateMany).not.toHaveBeenCalled();
  });

  it("rejects promoting with no permissions selected — an organiser is defined by having some", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Choose at least one permission for them to have as an organiser.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("allows promoting a member to organiser without touching the last-organiser check", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "ADMIN" });

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm", permWalks: "on" }),
    );

    expect(prismaMock.user.count).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, message: "Jo is now an organiser." });
  });

  it("writes the chosen permissions when promoting immediately", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "ADMIN" });

    await setMemberRole(
      null,
      roleForm({
        userId: target.id,
        role: "ADMIN",
        confirm: "confirm",
        permWalks: "on",
        permMembers: "on",
      }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        permWalks: true,
        permMembers: true,
        permReportsMessages: false,
        permSettings: false,
      },
    });
  });

  it("rejects when the acting admin is rate-limited", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 42 });
    const result = await setMemberRole(
      null,
      roleForm({ userId: "member-1", role: "ADMIN", confirm: "confirm" }),
    );
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in 42s." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("caps a limited organiser to promoting with only the permissions they hold themselves", async () => {
    // Only Members and Walks — no Reports/Settings — same shape a
    // Members-only organiser could otherwise use to hand a fresh account
    // full access by simply asking for it.
    requireAdmin.mockResolvedValueOnce({
      ...ADMIN,
      permReportsMessages: false,
      permSettings: false,
    });
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "ADMIN" });

    await setMemberRole(
      null,
      roleForm({
        userId: target.id,
        role: "ADMIN",
        confirm: "confirm",
        // Asks for everything, including the two the actor doesn't have.
        permWalks: "on",
        permMembers: "on",
        permReportsMessages: "on",
        permSettings: "on",
      }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        permWalks: true,
        permMembers: true,
        // Forced to false — the actor doesn't hold these themselves, and
        // a brand-new organiser has no legitimate existing state to keep.
        permReportsMessages: false,
        permSettings: false,
      },
    });
  });
});

describe("getMemberHistory", () => {
  it("returns null when the member is no longer there", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.attendance.count.mockResolvedValueOnce(0);
    const result = await getMemberHistory("gone");
    expect(result).toBeNull();
  });

  it("returns null for an organiser without the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await getMemberHistory(ADMIN.id);
    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("maps the member's attendance history and flags isYou for the acting admin's own record", async () => {
    const startsAt = new Date("2026-01-05T14:00:00Z");
    const clockedInAt = new Date("2026-01-05T13:55:00Z");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: ADMIN.id,
      firstName: "Ad",
      lastName: "Min",
      email: "admin@example.com",
      role: "ADMIN",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      permWalks: true,
      permMembers: true,
      permReportsMessages: true,
      permSettings: true,
      _count: { walksCreated: 4 },
      attendances: [
        {
          id: "att-1",
          clockedInAt,
          clockedOutAt: null,
          clockedOutReason: null,
          walk: {
            id: "walk-1",
            title: "Sunday stroll",
            location: "The park",
            durationMins: 60,
            startsAt,
            cancelledAt: null,
          },
        },
      ],
    });
    prismaMock.attendance.count.mockResolvedValueOnce(1);

    const result = await getMemberHistory(ADMIN.id);

    expect(result).toEqual({
      name: "Ad Min",
      email: "admin@example.com",
      role: "ADMIN",
      createdAt: "2025-01-01T00:00:00.000Z",
      walkCount: 4,
      attendanceCount: 1,
      isYou: true,
      pendingInvite: null,
      permissions: {
        permWalks: true,
        permMembers: true,
        permReportsMessages: true,
        permSettings: true,
      },
      items: [
        {
          id: "att-1",
          walkId: "walk-1",
          walkTitle: "Sunday stroll",
          location: "The park",
          durationMins: 60,
          startsAt: startsAt.toISOString(),
          endedAt: null,
          cancelledAt: null,
          clockedInAt: clockedInAt.toISOString(),
          clockedOutAt: null,
          clockedOutReason: null,
        },
      ],
    });
  });
});

describe("searchMembers", () => {
  it("returns an empty page for an organiser without the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await searchMembers({ role: "all" });
    expect(result).toEqual({ rows: [], total: 0 });
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  function member(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: "member-1",
      firstName: "Jo",
      lastName: "Bloggs",
      email: "jo@example.com",
      role: "MEMBER",
      createdAt: new Date("2026-01-05T00:00:00Z"),
      permWalks: true,
      permMembers: true,
      permReportsMessages: true,
      permSettings: true,
      _count: { attendances: 2, walksCreated: 0 },
      ...overrides,
    };
  }

  it("requires an admin", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    prismaMock.user.count.mockResolvedValueOnce(0);
    await searchMembers({});
    expect(requireAdmin).toHaveBeenCalled();
  });

  it("paginates using LIST_PAGE_SIZE and a stable createdAt/id order, with no filter when unfiltered", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([member()]);
    prismaMock.user.count.mockResolvedValueOnce(1);

    const result = await searchMembers({ page: 2 });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: 20,
        take: 20,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.rows).toEqual([
      {
        id: "member-1",
        name: "Jo Bloggs",
        email: "jo@example.com",
        role: "MEMBER",
        createdAt: "2026-01-05T00:00:00.000Z",
        attendanceCount: 2,
        walkCount: 0,
        pendingInvite: null,
        permissions: {
          permWalks: true,
          permMembers: true,
          permReportsMessages: true,
          permSettings: true,
        },
      },
    ]);
  });

  it("filters by role alone when there's no search text", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    prismaMock.user.count.mockResolvedValueOnce(0);

    await searchMembers({ role: "ADMIN" });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "ADMIN" } }),
    );
  });

  it("matches name or email substrings, case-insensitively", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    prismaMock.user.count.mockResolvedValueOnce(0);

    await searchMembers({ query: "jo" });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { email: { contains: "jo", mode: "insensitive" } },
                { firstName: { contains: "jo", mode: "insensitive" } },
                { lastName: { contains: "jo", mode: "insensitive" } },
              ],
            },
          ],
        },
      }),
    );
  });

  it("also matches by role when typing a role name (3+ letters)", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    prismaMock.user.count.mockResolvedValueOnce(0);

    await searchMembers({ query: "adm" });

    const call = prismaMock.user.findMany.mock.calls[0][0];
    expect(call.where.AND[0].OR).toEqual(
      expect.arrayContaining([{ role: "ADMIN" }]),
    );
  });

  it("does not apply the role-keyword shortcut for short queries", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    prismaMock.user.count.mockResolvedValueOnce(0);

    await searchMembers({ query: "ad" });

    const call = prismaMock.user.findMany.mock.calls[0][0];
    expect(call.where.AND[0].OR).not.toEqual(expect.arrayContaining([{ role: "ADMIN" }]));
  });
});

describe("setMemberRole — organiser invite required", () => {
  const target = {
    id: "member-1",
    role: "MEMBER",
    firstName: "Jo",
    lastName: "Bloggs",
    email: "jo@example.com",
  };

  it("rejects with no permissions selected before even checking the invite setting", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(target);

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Choose at least one permission for them to have as an organiser.",
    });
    expect(prismaMock.siteSetting.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("sends an invite instead of promoting immediately when the setting is on", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ organiserInviteRequired: true });
    prismaMock.user.update.mockResolvedValueOnce({});

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm", permWalks: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        organiserInviteToken: "invite-token-123",
        organiserInviteSentAt: expect.any(Date),
        organiserInviteExpiresAt: expect.any(Date),
        permWalks: true,
        permMembers: false,
        permReportsMessages: false,
        permSettings: false,
      },
    });
    expect(sendOrganiserInviteEmail).toHaveBeenCalledWith(target, "invite-token-123", {
      permWalks: true,
      permMembers: false,
      permReportsMessages: false,
      permSettings: false,
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      message: "Invite sent to Jo Bloggs. They'll become an organiser once they accept it.",
    });
  });

  it("still promotes immediately when the setting is off", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ organiserInviteRequired: false });
    prismaMock.user.update.mockResolvedValueOnce({ ...target, role: "ADMIN" });

    const result = await setMemberRole(
      null,
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm", permWalks: "on" }),
    );

    expect(sendOrganiserInviteEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, message: "Jo Bloggs is now an organiser." });
  });
});

describe("resendOrganiserInvite", () => {
  it("rejects an organiser without the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await resendOrganiserInvite(null, roleForm({ userId: "member-1" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage members." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("requires a member id", async () => {
    const result = await resendOrganiserInvite(null, roleForm({}));
    expect(result).toEqual({ ok: false, error: "No member selected." });
  });

  it("refuses when there is no pending invite", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      organiserInviteToken: null,
    });
    const result = await resendOrganiserInvite(null, roleForm({ userId: "member-1" }));
    expect(result).toEqual({ ok: false, error: "There is no pending invite for this person." });
  });

  it("refuses for someone already an organiser", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "admin-1",
      role: "ADMIN",
      organiserInviteToken: null,
    });
    const result = await resendOrganiserInvite(null, roleForm({ userId: "admin-1" }));
    expect(result).toEqual({ ok: false, error: "There is no pending invite for this person." });
  });

  it("reissues the invite with a fresh token", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: "Bloggs",
      email: "jo@example.com",
      organiserInviteToken: "old-token",
      permWalks: true,
      permMembers: false,
      permReportsMessages: true,
      permSettings: false,
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});

    const result = await resendOrganiserInvite(null, roleForm({ userId: target.id }));

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: target.id },
        data: expect.objectContaining({ organiserInviteToken: "invite-token-123" }),
      }),
    );
    // No permissions were passed for a resend — the email reflects whatever
    // is already on the row instead (see sendOrganiserInvite).
    expect(sendOrganiserInviteEmail).toHaveBeenCalledWith(target, "invite-token-123", {
      permWalks: true,
      permMembers: false,
      permReportsMessages: true,
      permSettings: false,
    });
    expect(result.ok).toBe(true);
  });
});

describe("setOrganiserPermissions", () => {
  it("rejects when the acting admin lacks the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await setOrganiserPermissions(null, roleForm({ userId: "admin-2" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage members." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("requires a member id", async () => {
    const result = await setOrganiserPermissions(null, roleForm({}));
    expect(result).toEqual({ ok: false, error: "No member selected." });
  });

  it("reports the member as already gone if the lookup finds nothing", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await setOrganiserPermissions(null, roleForm({ userId: "admin-2" }));
    expect(result).toEqual({ ok: false, error: "That member is no longer in the group." });
  });

  it("refuses for a plain member with no pending invite", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      organiserInviteToken: null,
    });
    const result = await setOrganiserPermissions(null, roleForm({ userId: "member-1" }));
    expect(result).toEqual({
      ok: false,
      error: "This person is not an organiser and has no pending invite.",
    });
  });

  it("saves the chosen permissions for an existing organiser", async () => {
    const target = { id: "admin-2", role: "ADMIN", firstName: "Sam", lastName: "Lee", email: "sam@example.com" };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});

    const result = await setOrganiserPermissions(
      null,
      roleForm({ userId: target.id, permWalks: "on", permSettings: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        permWalks: true,
        permMembers: false,
        permReportsMessages: false,
        permSettings: true,
      },
    });
    expect(result).toEqual({ ok: true, message: "Sam Lee's permissions have been updated." });
  });

  it("caps a limited organiser to editing only the permissions they hold themselves", async () => {
    // Members only — no Walks, Reports, or Settings.
    requireAdmin.mockResolvedValueOnce({
      ...ADMIN,
      permWalks: false,
      permReportsMessages: false,
      permSettings: false,
    });
    const target = {
      id: "admin-2",
      role: "ADMIN",
      firstName: "Sam",
      lastName: "Lee",
      email: "sam@example.com",
      // Sam currently has Walks but not Settings.
      permWalks: true,
      permMembers: false,
      permReportsMessages: false,
      permSettings: false,
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});

    await setOrganiserPermissions(
      null,
      // Tries to both grant Settings and revoke Walks — the actor controls
      // neither, so both requests are ignored.
      roleForm({ userId: target.id, permMembers: "on", permSettings: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        // Granted — the actor holds Members themselves.
        permMembers: true,
        // Untouched — Sam keeps the Walks access they already had, and
        // does not gain Settings, regardless of what was submitted.
        permWalks: true,
        permReportsMessages: false,
        permSettings: false,
      },
    });
  });

  it("allows editing permissions on a still-pending invite", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: null,
      email: "jo@example.com",
      organiserInviteToken: "tok",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});

    const result = await setOrganiserPermissions(
      null,
      roleForm({ userId: target.id, permWalks: "on" }),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects clearing every permission — an organiser must keep at least one", async () => {
    const target = { id: "admin-2", role: "ADMIN", firstName: "Sam", lastName: "Lee", email: "sam@example.com" };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);

    const result = await setOrganiserPermissions(null, roleForm({ userId: target.id }));

    expect(result).toEqual({
      ok: false,
      error: "Choose at least one permission — or make them a member instead.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe("cancelOrganiserInvite", () => {
  it("rejects an organiser without the Members permission", async () => {
    requireAdmin.mockResolvedValueOnce({ ...ADMIN, permMembers: false });
    const result = await cancelOrganiserInvite(null, roleForm({ userId: "member-1" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage members." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("requires a member id", async () => {
    const result = await cancelOrganiserInvite(null, roleForm({}));
    expect(result).toEqual({ ok: false, error: "No member selected." });
  });

  it("refuses when there is no pending invite", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      organiserInviteToken: null,
    });
    const result = await cancelOrganiserInvite(null, roleForm({ userId: "member-1" }));
    expect(result).toEqual({ ok: false, error: "There is no pending invite for this person." });
  });

  it("clears the pending invite", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: "Bloggs",
      email: "jo@example.com",
      organiserInviteToken: "tok",
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});

    const result = await cancelOrganiserInvite(null, roleForm({ userId: target.id }));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: { organiserInviteToken: null, organiserInviteSentAt: null, organiserInviteExpiresAt: null },
    });
    expect(result).toEqual({ ok: true, message: "Invite for Jo Bloggs cancelled." });
  });
});

describe("acceptOrganiserInvite", () => {
  function acceptForm(token: string): FormData {
    const formData = new FormData();
    formData.set("token", token);
    return formData;
  }

  it("rejects a missing token", async () => {
    const result = await acceptOrganiserInvite(null, acceptForm(""));
    expect(result).toEqual({ ok: false, error: "This invite link is invalid." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown token", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await acceptOrganiserInvite(null, acceptForm("bad-token"));
    expect(result).toEqual({
      ok: false,
      error: "This invite link is invalid or has already been used.",
    });
  });

  it("rejects a token whose invite has already been accepted (role no longer MEMBER)", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "ADMIN",
      organiserInviteExpiresAt: new Date(Date.now() + 1000),
    });
    const result = await acceptOrganiserInvite(null, acceptForm("tok"));
    expect(result).toEqual({
      ok: false,
      error: "This invite link is invalid or has already been used.",
    });
  });

  it("rejects an expired invite", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      organiserInviteExpiresAt: new Date(Date.now() - 1000),
    });
    const result = await acceptOrganiserInvite(null, acceptForm("tok"));
    expect(result).toEqual({
      ok: false,
      error: "This invite link has expired. Ask an organiser to resend it.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("promotes the invitee, clears the invite fields, and redirects to the Walks dashboard when granted Walks", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: "Bloggs",
      email: "jo@example.com",
      organiserInviteExpiresAt: new Date(Date.now() + 1000),
      permWalks: true,
      permMembers: false,
      permReportsMessages: false,
      permSettings: false,
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});
    getOptionalUser.mockResolvedValueOnce({ id: target.id });

    const result = await acceptOrganiserInvite(null, acceptForm("tok"));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        organiserInviteToken: null,
        organiserInviteSentAt: null,
        organiserInviteExpiresAt: null,
      },
    });
    expect(sendAdminPromotedEmail).toHaveBeenCalledWith(target);
    expect(result).toEqual({
      ok: true,
      message: "You're now an organiser.",
      href: "/admin",
    });
  });

  // Regression test: every admin page now checks its own specific
  // permission (requirePermission), so a fixed "/admin/members" 404s on
  // an organiser who was only granted Reports & messages — this is
  // exactly the bug an invite-time permission split can reintroduce.
  it("redirects to the first page an organiser without Walks or Members can actually use", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      firstName: "Jo",
      lastName: "Bloggs",
      email: "jo@example.com",
      organiserInviteExpiresAt: new Date(Date.now() + 1000),
      permWalks: false,
      permMembers: false,
      permReportsMessages: true,
      permSettings: false,
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    prismaMock.user.update.mockResolvedValueOnce({});
    getOptionalUser.mockResolvedValueOnce({ id: target.id });

    const result = await acceptOrganiserInvite(null, acceptForm("tok"));

    expect(result).toEqual({
      ok: true,
      message: "You're now an organiser.",
      href: "/admin/messages",
    });
  });

  it("refuses when no one is signed in", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      organiserInviteExpiresAt: new Date(Date.now() + 1000),
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    // getOptionalUser defaults to resolving null (not signed in).

    const result = await acceptOrganiserInvite(null, acceptForm("tok"));

    expect(result).toEqual({
      ok: false,
      error: "This invite can only be accepted by signing in as the invited account.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("refuses when signed in as a different account", async () => {
    const target = {
      id: "member-1",
      role: "MEMBER",
      organiserInviteExpiresAt: new Date(Date.now() + 1000),
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(target);
    getOptionalUser.mockResolvedValueOnce({ id: "someone-else" });

    const result = await acceptOrganiserInvite(null, acceptForm("tok"));

    expect(result).toEqual({
      ok: false,
      error: "This invite can only be accepted by signing in as the invited account.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
