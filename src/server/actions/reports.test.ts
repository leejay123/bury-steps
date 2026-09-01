import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: { accidentReport: { create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { addAccidentReport, deleteAccidentReport, updateAccidentReport } from "./reports";

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
    prismaMock.accidentReport.create.mockResolvedValueOnce({});
    await addAccidentReport(null, reportForm({ walkId: "none" }));
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ walkId: null }) }),
    );
  });

  it("saves the report, attributed to the acting admin", async () => {
    prismaMock.accidentReport.create.mockResolvedValueOnce({});
    const result = await addAccidentReport(null, reportForm());
    expect(prismaMock.accidentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdById: ADMIN.id }) }),
    );
    expect(result).toEqual({ ok: true, message: "Accident report saved." });
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
