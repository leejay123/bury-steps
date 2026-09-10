import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, sendAccidentReportAlertEmail } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: {
    accidentReport: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findMany: vi.fn(async (): Promise<{ email: string }[]> => []) },
  },
  sendAccidentReportAlertEmail: vi.fn(async () => {}),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
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

const ADMIN = { id: "admin-1" };

function reportForm(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("happenedAt", "2026-01-05T14:00");
  formData.set("whatHappened", "Someone tripped on a root.");
  formData.set("whoInvolved", "A member");
  formData.set("whatWeDid", "Checked on them, no injury.");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
});

describe("addAccidentReport", () => {
  it("rejects a missing date/time", async () => {
    const formData = reportForm();
    formData.delete("happenedAt");
    const result = await addAccidentReport(null, formData);
    expect(result.ok).toBe(false);
  });

  it("treats walkId 'none' the same as not selecting a walk", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    await addAccidentReport(null, reportForm({ walkId: "none" }));
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ walkId: null }) }),
    );
  });

  it("saves the report, attributed to the acting admin", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({ involvedMembers: [] });
    const result = await addAccidentReport(null, reportForm());
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdById: ADMIN.id }) }),
    );
    expect(result).toEqual({ ok: true, message: "Accident report saved." });
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
});

describe("updateAccidentReport", () => {
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
  it("requires a report to be selected", async () => {
    const result = await deleteAccidentReport(null, new FormData());
    expect(result).toEqual({ ok: false, error: "No report selected." });
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
