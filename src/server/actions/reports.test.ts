import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, sendAccidentReportAlertEmail, isOwner, actorStillOwner } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: {
    accidentReport: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    walk: { findUnique: vi.fn() },
    attendance: { findMany: vi.fn(async () => []) },
    user: {
      findMany: vi.fn(async (): Promise<{ email: string }[]> => []),
      findUnique: vi.fn(),
    },
  },
  sendAccidentReportAlertEmail: vi.fn(async () => {}),
  // Owner by default — deleting a report is owner-only regardless of the
  // Reports permissions. See the "not the owner" test below.
  isOwner: vi.fn(async (userId: string) => userId === "admin-1"),
  actorStillOwner: vi.fn(async (userId: string) => userId === "admin-1"),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/site-owner", () => ({ isOwner, actorStillOwner }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});
// Real email sending pulls in site-theme.ts (next/cache's unstable_cache,
// not mocked above) and hits the network — out of scope for these tests.
vi.mock("@/lib/email/mailer", () => ({ sendAccidentReportAlertEmail }));

import {
  addAccidentReport,
  deleteAccidentReport,
  setAccidentReportRetentionLocked,
  updateAccidentReport,
} from "./reports";

// Full access by default so existing tests exercise the authorized path —
// see the "permission guard" tests below for the false cases.
const ADMIN = {
  id: "admin-1",
  firstName: "Tom",
  lastName: "Robert",
  email: "tom.robert@example.com",
  permWalksView: true,
  permWalksCreate: true,
  permWalksEdit: true,
  permWalksCancel: true,
  permWalksAttendance: true,
  permWalksHealth: true,
  permWalksJourney: true,
  permWalksExport: true,
  permMembersView: true,
  permMessages: true,
  permReportsView: true,
  permReportsEdit: true,
  permReportsCreate: true,
  permHomepage: true,
  permNotices: true,
  permProgress: true,
  permEmails: true,
  permDisplay: true,
  permCacheReset: true,
};

const FINISHED_ATTENDED_WALK = {
  id: "walk-1",
  cancelledAt: null,
  startsAt: new Date(Date.now() - 3 * 60 * 60_000),
  durationMins: 60,
  endedAt: null,
  _count: { attendances: 2 },
};

function reportForm(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("happenedAt", "2026-01-05T14:00");
  formData.set("walkId", "walk-1");
  formData.set("whatHappened", "Someone tripped on a root.");
  formData.set("whoInvolved", "A member");
  formData.set("whatWeDid", "Checked on them, no injury.");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  prismaMock.accidentReport.findMany.mockResolvedValue([]);
  prismaMock.walk.findUnique.mockReset();
  prismaMock.walk.findUnique.mockResolvedValue(FINISHED_ATTENDED_WALK);
  isOwner.mockImplementation(async (userId: string) => userId === "admin-1");
  actorStillOwner.mockImplementation(async (userId: string) => userId === "admin-1");
});

describe("addAccidentReport", () => {
  it("rejects an organiser without the Create reports permission", async () => {
    requireAdmin.mockResolvedValue({ ...ADMIN, permReportsCreate: false });
    const result = await addAccidentReport(null, reportForm());
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to manage creating accident reports.",
    });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("rejects a missing date/time", async () => {
    const formData = reportForm();
    formData.delete("happenedAt");
    const result = await addAccidentReport(null, formData);
    expect(result.ok).toBe(false);
  });

  it.each(["none", ""])("rejects a report with no walk (walkId %j)", async (walkId) => {
    const result = await addAccidentReport(null, reportForm({ walkId }));
    expect(result).toEqual({ ok: false, error: "Choose the walk this report is about." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("rejects a finished walk nobody attended", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      ...FINISHED_ATTENDED_WALK,
      _count: { attendances: 0 },
    });
    const result = await addAccidentReport(null, reportForm());
    expect(result).toEqual({ ok: false, error: "Choose a finished walk that people attended." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("rejects a cancelled walk", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      ...FINISHED_ATTENDED_WALK,
      cancelledAt: new Date(),
    });
    const result = await addAccidentReport(null, reportForm());
    expect(result).toEqual({ ok: false, error: "Choose a finished walk that people attended." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("saves the report, attributed to the acting admin", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    const result = await addAccidentReport(null, reportForm());
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdById: ADMIN.id }) }),
    );
    expect(result).toEqual({ ok: true, message: "Accident report saved." });
  });

  it("does not number a report from who recorded it when no member was tagged", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    await addAccidentReport(null, reportForm());
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reportNumber: null, numberedForUserId: null }),
      }),
    );
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("numbers the report from the tagged member's initials, counting up", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ firstName: "Jane", lastName: "Doe" });
    prismaMock.accidentReport.create.mockResolvedValueOnce({
      involvedMembers: [{ user: { firstName: "Jane", lastName: "Doe" } }],
    });
    // Tagged members must have attended the report's walk (checked on each save).
    prismaMock.attendance.findMany
      .mockResolvedValueOnce([{ userId: "member-1" }] as never)
      .mockResolvedValueOnce([{ userId: "member-1" }] as never);
    const first = reportForm({ whoInvolved: "" });
    first.append("involvedMemberIds", "member-1");
    await addAccidentReport(null, first);
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reportNumber: "JD001", numberedForUserId: "member-1" }),
      }),
    );

    prismaMock.accidentReport.findMany.mockResolvedValueOnce([{ reportNumber: "JD001" }]);
    prismaMock.accidentReport.create.mockResolvedValueOnce({
      involvedMembers: [{ user: { firstName: "Jane", lastName: "Doe" } }],
    });
    const second = reportForm({ whoInvolved: "" });
    second.append("involvedMemberIds", "member-1");
    await addAccidentReport(null, second);
    expect(prismaMock.accidentReport.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reportNumber: "JD002", numberedForUserId: "member-1" }),
      }),
    );
  });

  it("numbers from the picked member when several people were involved", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ firstName: "Chris", lastName: "Berman" });
    prismaMock.accidentReport.create.mockResolvedValueOnce({
      involvedMembers: [
        { user: { firstName: "Jane", lastName: "Doe" } },
        { user: { firstName: "Chris", lastName: "Berman" } },
      ],
    });
    prismaMock.attendance.findMany.mockResolvedValueOnce([
      { userId: "member-1" },
      { userId: "member-2" },
    ] as never);
    const formData = reportForm({ whoInvolved: "", numberedForMemberId: "member-2" });
    formData.append("involvedMemberIds", "member-1");
    formData.append("involvedMemberIds", "member-2");
    await addAccidentReport(null, formData);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "member-2" } }),
    );
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reportNumber: "CB001", numberedForUserId: "member-2" }),
      }),
    );
  });

  it("asks who the number is for when several members are tagged and none is picked", async () => {
    const formData = reportForm({ whoInvolved: "" });
    formData.append("involvedMemberIds", "member-1");
    formData.append("involvedMemberIds", "member-2");
    const result = await addAccidentReport(null, formData);
    expect(result).toEqual({ ok: false, error: "Pick who this report is numbered for." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("alerts every other organiser, excluding whoever logged it", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    prismaMock.user.findMany.mockResolvedValueOnce([{ email: "other-admin@example.com" }]);

    await addAccidentReport(null, reportForm());

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "ADMIN", id: { not: ADMIN.id }, emailAccidentAlerts: true },
      }),
    );
    expect(sendAccidentReportAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ whoInvolved: "A member" }),
      ["other-admin@example.com"],
    );
  });

  it("rejects when neither free-text nor a tagged member says who was involved", async () => {
    const formData = reportForm({ whoInvolved: "" });
    const result = await addAccidentReport(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Say who was involved, or tag at least one member.",
    });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("accepts a tagged member alone, with no free text, and saves the link", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ firstName: "Jane", lastName: "Doe" });
    prismaMock.attendance.findMany.mockResolvedValueOnce([{ userId: "member-1" }] as never);
    prismaMock.accidentReport.create.mockResolvedValueOnce({
      involvedMembers: [{ user: { firstName: "Jane", lastName: "Doe" } }],
    });
    const formData = reportForm({ whoInvolved: "" });
    formData.append("involvedMemberIds", "member-1");

    const result = await addAccidentReport(null, formData);

    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          whoInvolved: "",
          involvedMembers: { create: [{ userId: "member-1" }] },
        }),
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("deduplicates repeated involvedMemberIds", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ firstName: "Jane", lastName: "Doe" });
    prismaMock.attendance.findMany.mockResolvedValueOnce([{ userId: "member-1" }] as never);
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    const formData = reportForm();
    formData.append("involvedMemberIds", "member-1");
    formData.append("involvedMemberIds", "member-1");

    await addAccidentReport(null, formData);

    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ involvedMembers: { create: [{ userId: "member-1" }] } }),
      }),
    );
  });

  it("rejects linking to a walk that has not started yet", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      cancelledAt: null,
      startsAt: new Date(Date.now() + 60_000),
      durationMins: 90,
      endedAt: null,
      _count: { attendances: 0 },
    });

    const result = await addAccidentReport(null, reportForm({ walkId: "walk-1" }));

    expect(result).toEqual({ ok: false, error: "Choose a finished walk that people attended." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("rejects a walk that is still in progress, even with people on it", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      cancelledAt: null,
      startsAt: new Date(Date.now() - 30 * 60_000),
      durationMins: 90,
      endedAt: null,
      _count: { attendances: 3 },
    });

    const result = await addAccidentReport(null, reportForm({ walkId: "walk-1" }));

    expect(result).toEqual({ ok: false, error: "Choose a finished walk that people attended." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("rejects linking to a walk that no longer exists", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce(null);
    const result = await addAccidentReport(null, reportForm({ walkId: "gone" }));
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });

  it("allows linking to a completed walk people attended", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });

    const result = await addAccidentReport(null, reportForm({ walkId: "walk-1" }));

    expect(result).toEqual({ ok: true, message: "Accident report saved." });
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ walkId: "walk-1" }) }),
    );
  });

  it("rejects tagged members who did not clock in to the linked walk", async () => {
    prismaMock.attendance.findMany.mockResolvedValueOnce([]);
    const formData = reportForm({ walkId: "walk-1", whoInvolved: "" });
    formData.append("involvedMemberIds", "member-1");

    const result = await addAccidentReport(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Tagged members must have clocked in to the linked walk.",
    });
    expect(prismaMock.accidentReport.create).not.toHaveBeenCalled();
  });
});

describe("updateAccidentReport", () => {
  it("rejects an organiser without the Edit reports permission", async () => {
    requireAdmin.mockResolvedValue({ ...ADMIN, permReportsEdit: false });
    const result = await updateAccidentReport(null, reportForm({ reportId: "report-1" }));
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to manage editing accident reports.",
    });
    expect(prismaMock.accidentReport.update).not.toHaveBeenCalled();
  });

  it("requires a report to be selected", async () => {
    const result = await updateAccidentReport(null, reportForm());
    expect(result).toEqual({ ok: false, error: "No report selected." });
  });

  it("reports the report as gone (P2025) rather than a generic failure", async () => {
    prismaMock.accidentReport.update.mockRejectedValueOnce({ code: "P2025" });
    const result = await updateAccidentReport(null, reportForm({ reportId: "report-1" }));
    expect(result).toEqual({ ok: false, error: "That report is no longer there." });
  });

  it("saves the update", async () => {
    prismaMock.accidentReport.update.mockResolvedValueOnce({});
    const result = await updateAccidentReport(null, reportForm({ reportId: "report-1" }));
    expect(result).toEqual({ ok: true, message: "Accident report saved." });
  });
});

describe("deleteAccidentReport", () => {
  it("rejects an organiser who isn't the owner — deleting is owner-only", async () => {
    isOwner.mockResolvedValueOnce(false);
    const formData = new FormData();
    formData.set("reportId", "report-1");
    const result = await deleteAccidentReport(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Only a site owner can delete an accident report.",
    });
    expect(prismaMock.accidentReport.delete).not.toHaveBeenCalled();
  });

  it("requires a report to be selected", async () => {
    const result = await deleteAccidentReport(null, new FormData());
    expect(result).toEqual({ ok: false, error: "No report selected." });
  });

  it("refuses if the acting admin lost ownership before the delete", async () => {
    actorStillOwner.mockResolvedValueOnce(false);
    const formData = new FormData();
    formData.set("reportId", "report-1");
    const result = await deleteAccidentReport(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Only a site owner can delete an accident report.",
    });
    expect(prismaMock.accidentReport.delete).not.toHaveBeenCalled();
  });

  it("removes the report", async () => {
    prismaMock.accidentReport.delete.mockResolvedValueOnce({});
    const formData = new FormData();
    formData.set("reportId", "report-1");
    const result = await deleteAccidentReport(null, formData);
    expect(result).toEqual({ ok: true, message: "Accident report removed." });
  });
});

describe("setAccidentReportRetentionLocked", () => {
  it("rejects an organiser without the Edit reports permission", async () => {
    requireAdmin.mockResolvedValue({ ...ADMIN, permReportsEdit: false });
    const formData = new FormData();
    formData.set("reportId", "report-1");
    const result = await setAccidentReportRetentionLocked(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to manage editing accident reports.",
    });
    expect(prismaMock.accidentReport.update).not.toHaveBeenCalled();
  });

  it("requires a report to be selected", async () => {
    const result = await setAccidentReportRetentionLocked(null, new FormData());
    expect(result).toEqual({ ok: false, error: "No report selected." });
  });

  it("reports the report as already gone (P2025) rather than a generic failure", async () => {
    prismaMock.accidentReport.update.mockRejectedValueOnce({ code: "P2025" });
    const formData = new FormData();
    formData.set("reportId", "report-1");
    formData.set("retentionLocked", "on");
    const result = await setAccidentReportRetentionLocked(null, formData);
    expect(result).toEqual({ ok: false, error: "That report is no longer there." });
  });

  it("flags the report", async () => {
    prismaMock.accidentReport.update.mockResolvedValueOnce({});
    const formData = new FormData();
    formData.set("reportId", "report-1");
    formData.set("retentionLocked", "on");
    const result = await setAccidentReportRetentionLocked(null, formData);
    expect(prismaMock.accidentReport.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { retentionLocked: true },
    });
    expect(result).toEqual({
      ok: true,
      message: "This report is flagged — it won't be deleted automatically.",
    });
  });

  it("unflags the report", async () => {
    prismaMock.accidentReport.update.mockResolvedValueOnce({});
    const formData = new FormData();
    formData.set("reportId", "report-1");
    const result = await setAccidentReportRetentionLocked(null, formData);
    expect(prismaMock.accidentReport.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { retentionLocked: false },
    });
    expect(result.ok).toBe(true);
  });
});
