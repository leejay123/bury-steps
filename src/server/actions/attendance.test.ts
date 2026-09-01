import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const {
  revalidatePath,
  requireAdmin,
  requireUser,
  checkRateLimit,
  canOrganiserAddAttendance,
  organiserRecordedClockInAt,
  windowState,
  prismaMock,
  transaction,
  queryRaw,
} = vi.hoisted(() => {
  const queryRaw = vi.fn();
  const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    walk: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    attendance: {
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  const transaction = vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return (arg as (tx: unknown) => unknown)({ $queryRaw: queryRaw, ...prismaMock });
  });
  return {
    revalidatePath: vi.fn(),
    requireAdmin: vi.fn(),
    requireUser: vi.fn(),
    checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
    canOrganiserAddAttendance: vi.fn(),
    organiserRecordedClockInAt: vi.fn(),
    windowState: vi.fn(),
    prismaMock,
    transaction,
    queryRaw,
  };
});

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/walk-window", () => ({
  canOrganiserAddAttendance,
  organiserRecordedClockInAt,
  windowState,
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin, requireUser };
});

import { adminClockIn, adminRemoveAttendance, clockIn, clockOut, searchAddableMembers } from "./attendance";

const USER = { id: "user-1" };
const ADMIN = { id: "admin-1" };

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

/** Row shape returned by the raw `SELECT ... FOR UPDATE` lock queries. */
function lockedWalkRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "walk-1",
    token: "tok-1",
    slug: "sunday-stroll",
    startsAt: new Date("2026-01-05T14:00:00Z"),
    durationMins: 60,
    cancelledAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(USER);
  requireAdmin.mockResolvedValue(ADMIN);
  checkRateLimit.mockReturnValue({ ok: true });
  windowState.mockReturnValue("open");
  canOrganiserAddAttendance.mockReturnValue(true);
  organiserRecordedClockInAt.mockImplementation((_walk, now = new Date()) => now);
});

describe("clockIn", () => {
  function clockInForm(overrides: Partial<Record<string, string>> = {}) {
    return form({
      token: "tok-1",
      medicalAck: "on",
      hasConditions: "no",
      ...overrides,
    });
  }

  it("rejects when the member is rate-limited", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 30 });
    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in 30s." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an unacknowledged medical disclaimer", async () => {
    const result = await clockIn(null, clockInForm({ medicalAck: "off" }));
    expect(result.ok).toBe(false);
  });

  it("requires a note when the member says they have conditions", async () => {
    const result = await clockIn(null, clockInForm({ hasConditions: "yes" }));
    expect(result).toEqual({
      ok: false,
      error: "Add a short note about your conditions, or select “No conditions to report”.",
    });
  });

  it("treats a missing walk token as invalid — same message a cancelled walk gets", async () => {
    queryRaw.mockResolvedValueOnce([]);
    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({ ok: false, error: "This walk link is not valid." });
  });

  it("does not reveal that a walk is cancelled — reuses the missing-token message", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow({ cancelledAt: new Date() })]);
    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({ ok: false, error: "This walk link is not valid." });
  });

  it("rejects clocking in before the window opens", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    windowState.mockReturnValueOnce("too-early");
    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({
      ok: false,
      error: "Clock-in opens an hour before the walk starts.",
    });
  });

  it("rejects clocking in after the window has closed", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    windowState.mockReturnValueOnce("closed");
    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({
      ok: false,
      error: "Clock-in for this walk has closed. Speak to an organiser.",
    });
  });

  it("creates a new attendance row when the member has never clocked in before", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.attendance.create.mockResolvedValueOnce({});

    const result = await clockIn(null, clockInForm());

    expect(prismaMock.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ walkId: "walk-1", userId: USER.id }),
      }),
    );
    expect(result).toEqual({ ok: true, message: "Clocked in. Enjoy the walk." });
  });

  it("re-clocks-in via update instead of creating a duplicate row when they'd already clocked out", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 1 });

    await clockIn(null, clockInForm());

    expect(prismaMock.attendance.create).not.toHaveBeenCalled();
  });

  it("stores the reported conditions when the member has some to report", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.attendance.create.mockResolvedValueOnce({});

    await clockIn(null, clockInForm({ hasConditions: "yes", conditions: "Bad knee" }));

    expect(prismaMock.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ conditions: "Bad knee" }),
      }),
    );
  });

  it("reports a friendly message when a concurrent request already clocked them in (unique-constraint race)", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.attendance.create.mockRejectedValueOnce({ code: "P2002" });

    const result = await clockIn(null, clockInForm());
    expect(result).toEqual({ ok: false, error: "You are already clocked in for this walk." });
  });
});

describe("adminClockIn", () => {
  const member = { id: "member-1", firstName: "Jo", lastName: null, email: "jo@example.com" };

  function adminClockInForm(overrides: Partial<Record<string, string>> = {}) {
    return form({ walkId: "walk-1", userId: member.id, ...overrides });
  }

  it("rejects when the member is no longer there", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({ ok: false, error: "That member is no longer there." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects when the walk is no longer there", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([]);
    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("tells the organiser to reopen a cancelled walk before adding someone", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow({ cancelledAt: new Date() })]);
    canOrganiserAddAttendance.mockReturnValueOnce(false);

    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({
      ok: false,
      error: "Reopen this walk before adding someone to it.",
    });
  });

  it("blocks adding someone more than an hour before the walk starts", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    canOrganiserAddAttendance.mockReturnValueOnce(false);

    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({
      ok: false,
      error: "You can add someone from an hour before the walk starts.",
    });
  });

  it("blocks re-adding someone who is already active on the walk", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.findUnique.mockResolvedValueOnce({ id: "att-1", clockedOutAt: null });
    windowState.mockReturnValueOnce("open");

    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({ ok: false, error: "Jo is already on this walk’s list." });
    expect(prismaMock.attendance.update).not.toHaveBeenCalled();
  });

  it("blocks re-adding once the window has closed, even if they'd clocked out", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.findUnique.mockResolvedValueOnce({
      id: "att-1",
      clockedOutAt: new Date(),
    });
    windowState.mockReturnValueOnce("closed");

    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({ ok: false, error: "Jo is already on this walk’s list." });
  });

  it("creates a fresh attendance row for someone never on the walk", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.findUnique.mockResolvedValueOnce(null);
    windowState.mockReturnValueOnce("open");
    prismaMock.attendance.create.mockResolvedValueOnce({});

    const result = await adminClockIn(null, adminClockInForm());

    expect(prismaMock.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ walkId: "walk-1", userId: member.id }),
      }),
    );
    expect(result).toEqual({ ok: true, message: "Jo has been clocked in." });
  });

  it("re-adds someone who'd clocked out while the window is still open, via update", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.findUnique.mockResolvedValueOnce({
      id: "att-1",
      clockedOutAt: new Date(),
    });
    windowState.mockReturnValueOnce("open");
    prismaMock.attendance.update.mockResolvedValueOnce({});

    await adminClockIn(null, adminClockInForm());

    expect(prismaMock.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "att-1" } }),
    );
    expect(prismaMock.attendance.create).not.toHaveBeenCalled();
  });

  it("phrases the success message as 'added' rather than 'clocked in' once the window has closed", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(member);
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    prismaMock.attendance.findUnique.mockResolvedValueOnce(null);
    windowState.mockReturnValueOnce("closed");
    prismaMock.attendance.create.mockResolvedValueOnce({});

    const result = await adminClockIn(null, adminClockInForm());
    expect(result).toEqual({
      ok: true,
      message: "Jo has been added as attending this walk.",
    });
  });
});

describe("adminRemoveAttendance", () => {
  function removeForm(attendanceId = "att-1") {
    return form({ attendanceId });
  }

  const attendance = {
    id: "att-1",
    userId: "member-1",
    user: { firstName: "Jo", lastName: null, email: "jo@example.com" },
    walk: { id: "walk-1", token: "tok-1", slug: null, cancelledAt: null },
  };

  it("reports the person as already gone if the attendance row is no longer there", async () => {
    prismaMock.attendance.findUnique.mockResolvedValueOnce(null);
    const result = await adminRemoveAttendance(null, removeForm());
    expect(result).toEqual({ ok: false, error: "That person is no longer on this walk." });
  });

  it("requires the walk be reopened before removing someone from a cancelled walk", async () => {
    prismaMock.attendance.findUnique.mockResolvedValueOnce(attendance);
    queryRaw.mockResolvedValueOnce([{ id: "walk-1", cancelledAt: new Date() }]);

    const result = await adminRemoveAttendance(null, removeForm());
    expect(result).toEqual({
      ok: false,
      error: "Reopen this walk before removing someone from it.",
    });
    expect(prismaMock.attendance.delete).not.toHaveBeenCalled();
  });

  it("removes the attendance row when the walk is not cancelled", async () => {
    prismaMock.attendance.findUnique.mockResolvedValueOnce(attendance);
    queryRaw.mockResolvedValueOnce([{ id: "walk-1", cancelledAt: null }]);
    prismaMock.attendance.delete.mockResolvedValueOnce({});

    const result = await adminRemoveAttendance(null, removeForm());
    expect(prismaMock.attendance.delete).toHaveBeenCalledWith({ where: { id: "att-1" } });
    expect(result).toEqual({
      ok: true,
      message: "Jo has been removed from this walk.",
    });
  });
});

describe("clockOut", () => {
  function clockOutForm(overrides: Partial<Record<string, string>> = {}) {
    return form({ token: "tok-1", reason: "Feeling unwell", ...overrides });
  }

  it("rejects when rate-limited", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 15 });
    const result = await clockOut(null, clockOutForm());
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in 15s." });
  });

  it("rejects too short a reason", async () => {
    const result = await clockOut(null, clockOutForm({ reason: "ok" }));
    expect(result.ok).toBe(false);
  });

  it("treats a missing or cancelled walk link the same way", async () => {
    queryRaw.mockResolvedValueOnce([]);
    const result = await clockOut(null, clockOutForm());
    expect(result).toEqual({ ok: false, error: "This walk link is not valid." });
  });

  it("refuses to clock out once the walk has fully finished", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    windowState.mockReturnValueOnce("closed");
    const result = await clockOut(null, clockOutForm());
    expect(result).toEqual({
      ok: false,
      error: "This walk has finished — there's no need to clock out.",
    });
  });

  it("rejects when the member was never clocked in to begin with", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    windowState.mockReturnValueOnce("open");
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await clockOut(null, clockOutForm());
    expect(result).toEqual({ ok: false, error: "You are not clocked in for this walk." });
  });

  it("clocks the member out with their reason recorded", async () => {
    queryRaw.mockResolvedValueOnce([lockedWalkRow()]);
    windowState.mockReturnValueOnce("open");
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await clockOut(null, clockOutForm({ reason: "Feeling unwell" }));

    expect(prismaMock.attendance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clockedOutReason: "Feeling unwell" }),
      }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("searchAddableMembers", () => {
  it("returns nothing when no walk is selected", async () => {
    expect(await searchAddableMembers("", "jo")).toEqual([]);
    expect(prismaMock.walk.findUnique).not.toHaveBeenCalled();
  });

  it("returns nothing once the window has closed to new additions", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      startsAt: new Date(),
      durationMins: 60,
      cancelledAt: null,
      attendances: [],
    });
    canOrganiserAddAttendance.mockReturnValueOnce(false);

    expect(await searchAddableMembers("walk-1", "")).toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("excludes only currently-active members while the window is open, so a clocked-out member can be re-added", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      startsAt: new Date(),
      durationMins: 60,
      cancelledAt: null,
      attendances: [
        { userId: "active-1", clockedOutAt: null },
        { userId: "left-1", clockedOutAt: new Date() },
      ],
    });
    windowState.mockReturnValueOnce("open");
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    await searchAddableMembers("walk-1", "");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: ["active-1"] } }),
      }),
    );
  });

  it("excludes everyone with any attendance row once the window has closed", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      startsAt: new Date(),
      durationMins: 60,
      cancelledAt: null,
      attendances: [
        { userId: "active-1", clockedOutAt: null },
        { userId: "left-1", clockedOutAt: new Date() },
      ],
    });
    windowState.mockReturnValueOnce("closed");
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    await searchAddableMembers("walk-1", "");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: ["active-1", "left-1"] } }),
      }),
    );
  });

  it("formats a member's label as name · email, or just email when there's no name on file", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      startsAt: new Date(),
      durationMins: 60,
      cancelledAt: null,
      attendances: [],
    });
    windowState.mockReturnValueOnce("open");
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: "u1", firstName: "Jo", lastName: "Lee", email: "jo@example.com" },
      { id: "u2", firstName: null, lastName: null, email: "anon@example.com" },
    ]);

    const result = await searchAddableMembers("walk-1", "");
    expect(result).toEqual([
      { id: "u1", label: "Jo Lee · jo@example.com" },
      { id: "u2", label: "anon@example.com" },
    ]);
  });
});
