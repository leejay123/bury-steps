import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    attendance: { updateMany: vi.fn(async () => ({ count: 0 })) },
    walk: { deleteMany: vi.fn(async () => ({ count: 0 })) },
    accidentReport: { deleteMany: vi.fn(async () => ({ count: 0 })) },
    siteSetting: {
      findUnique: vi.fn(
        async (): Promise<{
          cancelledWalkRetentionDays: number | null;
          accidentReportRetentionDays: number | null;
        }> => ({
          cancelledWalkRetentionDays: 30,
          accidentReportRetentionDays: null,
        }),
      ),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { GET } from "./route";

function request(secret?: string): Request {
  return new Request("https://example.test/api/cron/purge-conditions", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  prismaMock.siteSetting.findUnique.mockResolvedValue({
    cancelledWalkRetentionDays: 30,
    accidentReportRetentionDays: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/cron/purge-conditions", () => {
  it("rejects without the correct bearer token", async () => {
    const res = await GET(request("wrong"));
    expect(res.status).toBe(401);
    expect(prismaMock.attendance.updateMany).not.toHaveBeenCalled();
  });

  it("rejects when CRON_SECRET isn't configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(request("test-secret"));
    expect(res.status).toBe(401);
  });

  it("clears expired medical conditions", async () => {
    prismaMock.attendance.updateMany.mockResolvedValueOnce({ count: 3 });
    const res = await GET(request("test-secret"));
    expect(await res.json()).toEqual(
      expect.objectContaining({ purged: 3 }),
    );
  });

  it("deletes cancelled walks past the configured retention, excluding flagged ones", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T06:00:00Z"));
    prismaMock.walk.deleteMany.mockResolvedValueOnce({ count: 2 });

    const res = await GET(request("test-secret"));

    expect(prismaMock.walk.deleteMany).toHaveBeenCalledWith({
      where: {
        cancelledAt: { lte: new Date("2026-08-11T06:00:00Z") },
        retentionLocked: false,
      },
    });
    expect(await res.json()).toEqual(expect.objectContaining({ deletedCancelled: 2 }));
  });

  it("skips deleting cancelled walks entirely when the setting is off", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      cancelledWalkRetentionDays: null,
      accidentReportRetentionDays: null,
    });

    const res = await GET(request("test-secret"));

    expect(prismaMock.walk.deleteMany).not.toHaveBeenCalled();
    expect(await res.json()).toEqual(expect.objectContaining({ deletedCancelled: 0 }));
  });

  it("deletes accident reports past the configured retention, excluding flagged ones", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T06:00:00Z"));
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      cancelledWalkRetentionDays: null,
      accidentReportRetentionDays: 90,
    });
    prismaMock.accidentReport.deleteMany.mockResolvedValueOnce({ count: 1 });

    const res = await GET(request("test-secret"));

    expect(prismaMock.accidentReport.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: { lte: new Date("2026-06-12T06:00:00Z") },
        retentionLocked: false,
      },
    });
    expect(await res.json()).toEqual(expect.objectContaining({ deletedReports: 1 }));
  });

  it("leaves accident reports alone when the setting is off (the default)", async () => {
    const res = await GET(request("test-secret"));
    expect(prismaMock.accidentReport.deleteMany).not.toHaveBeenCalled();
    expect(await res.json()).toEqual(expect.objectContaining({ deletedReports: 0 }));
  });
});
