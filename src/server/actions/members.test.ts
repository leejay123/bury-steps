import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const { revalidatePath, requireAdmin, checkRateLimit, deleteUser, prismaMock, transaction } =
  vi.hoisted(() => {
    const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
      user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
      walk: { updateMany: vi.fn() },
      accidentReport: { updateMany: vi.fn() },
      walkJourneyEvent: { updateMany: vi.fn() },
      attendance: { count: vi.fn() },
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
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { deleteMember, getMemberHistory, setMemberRole } from "./members";

const ADMIN = { id: "admin-1", clerkId: "clerk-admin-1" };

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
      roleForm({ userId: target.id, role: "ADMIN", confirm: "confirm" }),
    );

    expect(prismaMock.user.count).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, message: "Jo is now an organiser." });
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
});

describe("getMemberHistory", () => {
  it("returns null when the member is no longer there", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.attendance.count.mockResolvedValueOnce(0);
    const result = await getMemberHistory("gone");
    expect(result).toBeNull();
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
      items: [
        {
          id: "att-1",
          walkId: "walk-1",
          walkTitle: "Sunday stroll",
          location: "The park",
          durationMins: 60,
          startsAt: startsAt.toISOString(),
          cancelledAt: null,
          clockedInAt: clockedInAt.toISOString(),
          clockedOutAt: null,
          clockedOutReason: null,
        },
      ],
    });
  });
});
